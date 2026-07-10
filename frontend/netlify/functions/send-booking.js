// Netlify Serverless Function: send-booking
// Handles form submissions, sends email via Resend, and SMS via SMSPlanet.

export const handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Metoda niedozwolona' })
    };
  }

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, phone, email, category, service, date, time, notes } = data;

    // Validation
    if (!name || !phone || !email || !category || !service || !date || !time) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Wszystkie wymagane pola muszą być wypełnione.' })
      };
    }

    // Hour validation: must be between 09:00 and 17:00
    const [hour, minutes] = time.split(':').map(Number);
    const timeInMinutes = hour * 60 + minutes;
    const minTime = 9 * 60; // 09:00
    const maxTime = 17 * 60; // 17:00

    if (timeInMinutes < minTime || timeInMinutes > maxTime) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Godzina wizyty musi mieścić się w przedziale 09:00 - 17:00.' })
      };
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
      } catch (err) {
        emailErrorMsg = `Błąd wysyłki e-mail: ${err.message}`;
      }
    } else {
      emailErrorMsg = 'Brak konfiguracji zmiennych RESEND_API_KEY lub NOTIFICATION_EMAIL';
    }

    // B) Send SMS via SMSPlanet API
    const smsplanetKey = process.env.SMSPLANET_API_KEY;
    const smsplanetPassword = process.env.SMSPLANET_PASSWORD;
    const smsplanetPhone = process.env.SMSPLANET_PHONE;
    const smsplanetFrom = process.env.SMSPLANET_FROM;

    if (smsplanetKey && smsplanetPassword && smsplanetPhone && smsplanetFrom) {
      try {
        const smsParams = new URLSearchParams();
        smsParams.append('key', smsplanetKey);
        smsParams.append('password', smsplanetPassword);
        smsParams.append('from', smsplanetFrom);
        smsParams.append('to', smsplanetPhone);
        smsParams.append('msg', `Nowa rezerwacja: ${name}, ${service}, ${date} ${time}, tel: ${phone}`);

        const smsResponse = await fetch('https://api2.smsplanet.pl/sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: smsParams
        });

        const rawSmsText = await smsResponse.text();
        let smsData = {};
        try {
          smsData = JSON.parse(rawSmsText);
        } catch (parseErr) {
          smsData = { raw: rawSmsText };
        }

        // SMSPlanet zwraca {"messageId":"..."} przy sukcesie
        // lub {"errorMsg":"...","errorCode":123} przy błędzie
        if (smsResponse.ok && smsData.messageId) {
          smsSuccess = true;
        } else {
          smsErrorMsg = `SMSPlanet: ${smsData.errorMsg || rawSmsText} (kod: ${smsData.errorCode ?? smsResponse.status})`;
        }
      } catch (err) {
        smsErrorMsg = `Błąd wysyłki SMS: ${err.message}`;
      }
    } else {
      smsErrorMsg = 'Brak konfiguracji zmiennych SMSPLANET_API_KEY, SMSPLANET_PASSWORD, SMSPLANET_PHONE lub SMSPLANET_FROM';
    }

    // Success check: client sees success if AT LEAST ONE notification was sent
    if (emailSuccess || smsSuccess) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          emailSuccess,
          smsSuccess,
          message: 'Zapytanie o rezerwację zostało pomyślnie wysłane.'
        })
      };
    } else {
      // Both failed
      return {
        statusCode: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Nie udało się dostarczyć powiadomienia o rezerwacji.',
          details: { emailErrorMsg, smsErrorMsg }
        })
      };
    }

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: `Błąd serwera: ${err.message}` })
    };
  }
};
