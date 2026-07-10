import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route for sending booking
  app.post("/api/send-booking", async (req, res) => {
    const { name, phone, email, category, service, date, time, notes } = req.body;

    // Validation
    if (!name || !phone || !email || !category || !service || !date || !time) {
      return res.status(400).json({ error: 'Wszystkie wymagane pola muszą być wypełnione.' });
    }

    // Hour validation based on day of week schedule
    const d = new Date(date);
    const dayOfWeek = d.getUTCDay(); // Safe parsing for YYYY-MM-DD on server

    let minHourStr = "09:00";
    let maxHourStr = "17:00";
    let isClosed = false;

    if (dayOfWeek === 1 || dayOfWeek === 4) { // Monday, Thursday
      minHourStr = "13:00";
      maxHourStr = "20:00";
    } else if (dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 5) { // Tuesday, Wednesday, Friday
      minHourStr = "09:00";
      maxHourStr = "17:00";
    } else { // Weekend or invalid
      isClosed = true;
    }

    if (isClosed) {
      return res.status(400).json({ error: 'W wybranym dniu (weekend) salon jest zamknięty.' });
    }

    const [minH, minM] = minHourStr.split(':').map(Number);
    const [maxH, maxM] = maxHourStr.split(':').map(Number);
    const minTime = minH * 60 + minM;
    const maxTime = maxH * 60 + maxM;

    const [hour, minutes] = time.split(':').map(Number);
    const timeInMinutes = hour * 60 + minutes;

    if (timeInMinutes < minTime || timeInMinutes > maxTime) {
      return res.status(400).json({ error: `Godzina wizyty musi mieścić się w przedziale ${minHourStr} - ${maxHourStr}.` });
    }

    let emailSuccess = false;
    let smsSuccess = false;
    let emailErrorMsg = '';
    let smsErrorMsg = '';

    // A) Send email via Resend API
    const resendApiKey = process.env.RESEND_API_KEY;
    const notificationEmail = process.env.NOTIFICATION_EMAIL;

    if (resendApiKey && notificationEmail) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'rezerwacje@znnkstudio.eu',
            to: notificationEmail,
            subject: `Nowa rezerwacja: ${name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #C5A059; border-radius: 8px; background-color: #0F0F0F; color: #E0E0E0;">
                <h2 style="color: #C5A059; border-bottom: 1px solid #C5A059; padding-bottom: 10px; text-transform: uppercase;">Nowe zapytanie o rezerwację</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #C5A059; width: 35%;">Imię i nazwisko:</td>
                    <td style="padding: 8px 0; color: #ffffff;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #C5A059;">Telefon:</td>
                    <td style="padding: 8px 0; color: #ffffff;"><a href="tel:${phone}" style="color: #C5A059; text-decoration: none;">${phone}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #C5A059;">Adres e-mail:</td>
                    <td style="padding: 8px 0; color: #ffffff;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #C5A059;">Kategoria:</td>
                    <td style="padding: 8px 0; color: #ffffff;">${category}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #C5A059;">Usługa:</td>
                    <td style="padding: 8px 0; color: #ffffff;">${service}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #C5A059;">Data:</td>
                    <td style="padding: 8px 0; color: #ffffff;">${date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #C5A059;">Godzina:</td>
                    <td style="padding: 8px 0; color: #ffffff;">${time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0 8px 0; font-weight: bold; color: #C5A059; border-top: 1px solid #C5A059; margin-top: 10px;" colspan="2">Dodatkowe uwagi:</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; background-color: #141414; border-radius: 4px; color: #cccccc;" colspan="2">${notes || 'Brak dodatkowych uwag.'}</td>
                  </tr>
                </table>
                <div style="margin-top: 25px; font-size: 11px; text-align: center; color: #888888; border-top: 1px dashed #333333; padding-top: 15px;">
                  Wiadomość wygenerowana automatycznie przez system rezerwacji Beauty Style.
                </div>
              </div>
            `
          })
        });

        if (emailResponse.ok) {
          emailSuccess = true;
        } else {
          emailErrorMsg = `Resend status: ${emailResponse.status} ${await emailResponse.text()}`;
        }
      } catch (err: any) {
        emailErrorMsg = `Błąd wysyłki e-mail: ${err.message}`;
      }
    } else {
      emailErrorMsg = 'Brak konfiguracji zmiennych RESEND_API_KEY lub NOTIFICATION_EMAIL';
    }

    // B) Send SMS via SMSPlanet API
    const smsplanetKey = process.env.SMSPLANET_API_KEY;
    const smsplanetPassword = process.env.SMSPLANET_PASSWORD;
    const smsplanetPhone = process.env.SMSPLANET_PHONE;

    if (smsplanetKey && smsplanetPassword && smsplanetPhone) {
      try {
        const smsParams = new URLSearchParams();
        smsParams.append('key', smsplanetKey);
        smsParams.append('password', smsplanetPassword);
        smsParams.append('to', smsplanetPhone);
        smsParams.append('msg', `Nowa rezerwacja: ${name}, ${service}, ${date} ${time}, tel: ${phone}`);

        const smsUrl = `https://api2.smsplanet.pl/sms?${smsParams.toString()}`;
        const smsResponse = await fetch(smsUrl, {
          method: 'GET'
        });

        if (smsResponse.ok) {
          const smsData: any = await smsResponse.json().catch(() => ({}));
          if (smsData && (smsData.id || smsData.status === 'OK' || smsData.success || !smsData.error)) {
            smsSuccess = true;
          } else {
            smsErrorMsg = `SMSPlanet error code: ${JSON.stringify(smsData)}`;
          }
        } else {
          smsErrorMsg = `SMSPlanet status: ${smsResponse.status} ${await smsResponse.text()}`;
        }
      } catch (err: any) {
        smsErrorMsg = `Błąd wysyłki SMS: ${err.message}`;
      }
    } else {
      smsErrorMsg = 'Brak konfiguracji zmiennych SMSPLANET_API_KEY, SMSPLANET_PASSWORD lub SMSPLANET_PHONE';
    }

    // Success check: client sees success if AT LEAST ONE notification was sent
    if (emailSuccess || smsSuccess) {
      return res.status(200).json({
        success: true,
        emailSuccess,
        smsSuccess,
        message: 'Zapytanie o rezerwację zostało pomyślnie wysłane.'
      });
    } else {
      return res.status(502).json({
        success: false,
        error: 'Nie udało się dostarczyć powiadomienia o rezerwacji.',
        details: { emailErrorMsg, smsErrorMsg }
      });
    }
  });

  // Vite dev server or static server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
