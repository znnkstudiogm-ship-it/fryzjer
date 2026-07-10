export interface ServiceItem {
  name: string;
  price: string;
  duration: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string; // lucide icon name
  description: string;
  items: ServiceItem[];
}

export const SALON_SERVICES: ServiceCategory[] = [
  {
    id: "koloryzacja",
    name: "Koloryzacja",
    icon: "Sparkles",
    description: "Profesjonalna koloryzacja włosów dostosowana do Twojej urody i kondycji włosów.",
    items: [
      { name: "Koloryzacja wł. średnie – jeden kolor", price: "200–300 zł", duration: "120 min" },
      { name: "Koloryzacja odrost", price: "100 zł", duration: "90 min" },
      { name: "Koloryzacja wł. krótkie – jeden kolor", price: "150–180 zł", duration: "90 min" },
      { name: "Koloryzacja wł. długie – jeden kolor", price: "300–350 zł", duration: "180 min" },
      { name: "Balayage/Refleks – wł. krótkie", price: "250 zł", duration: "120 min" },
      { name: "Balayage/Refleks – wł. średnie", price: "280 zł", duration: "150 min" },
      { name: "Balayage/Refleks – wł. długie", price: "350 zł", duration: "180 min" },
      { name: "Pasemka – wł. krótkie", price: "160 zł", duration: "120 min" },
      { name: "Pasemka – wł. średnie", price: "230 zł", duration: "180 min" },
      { name: "Pasemka – wł. długie", price: "250–300 zł", duration: "180 min" }
    ]
  },
  {
    id: "strzyzenie_damskie",
    name: "Strzyżenie damskie",
    icon: "Scissors",
    description: "Modne strzyżenie i profesjonalne modelowanie dopasowane do kształtu twarzy.",
    items: [
      { name: "Strzyżenie damskie krótkie", price: "50 zł", duration: "45 min" },
      { name: "Strzyżenie damskie średnie", price: "60 zł", duration: "45 min" },
      { name: "Strzyżenie damskie długie", price: "70 zł", duration: "50 min" },
      { name: "Toner", price: "80–200 zł", duration: "30 min" },
      { name: "Pielęgnacja Jojko", price: "200–300 zł", duration: "90 min" },
      { name: "Sauna na włosy", price: "100–200 zł", duration: "45 min" },
      { name: "Trwała ondulacja", price: "120 zł", duration: "120 min" }
    ]
  },
  {
    id: "strzyzenie_meskie",
    name: "Strzyżenie męskie",
    icon: "User",
    description: "Precyzyjne strzyżenie męskie oraz pielęgnacja zarostu.",
    items: [
      { name: "Strzyżenie męskie", price: "40 zł", duration: "20 min" },
      { name: "Broda i wąsy", price: "30 zł", duration: "20 min" }
    ]
  },
  {
    id: "pielegnacja",
    name: "Pielęgnacja",
    icon: "Heart",
    description: "Głęboka regeneracja i odżywienie dla zmęczonych i zniszczonych włosów.",
    items: [
      { name: "Pielęgnacja na podczerwień", price: "100–250 zł", duration: "90 min" }
    ]
  },
  {
    id: "czesanie",
    name: "Czesanie",
    icon: "Flame",
    description: "Stylizacja i fryzury na wyjątkowe okazje, wesela i komunie.",
    items: [
      { name: "Czesanie", price: "40–100 zł", duration: "45 min" },
      { name: "Loki", price: "80–150 zł", duration: "90 min" },
      { name: "Czesanie ślubne", price: "100–250 zł", duration: "90 min" },
      { name: "Czesanie komunijne", price: "100 zł", duration: "90 min" },
      { name: "Modelowanie", price: "30 zł", duration: "30 min" }
    ]
  }
];
