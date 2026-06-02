import { PrismaClient } from '@prisma/client';

import "dotenv/config";
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.aIRequestLog.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.expenseParticipant.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.note.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.document.deleteMany();
  await prisma.place.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.day.deleteMany();
  await prisma.tripParticipant.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const alina = await prisma.user.create({
    data: { name: 'Алина', initials: 'АЛ', avatarColor: 'oklch(56% .14 192)', email: 'alina@example.com' }
  });
  const maxim = await prisma.user.create({
    data: { name: 'Максим', initials: 'МК', avatarColor: 'oklch(62% .16 28)', email: 'maxim@example.com' }
  });
  const sveta = await prisma.user.create({
    data: { name: 'Света', initials: 'СВ', avatarColor: 'oklch(60% .15 300)', email: 'sveta@example.com' }
  });
  const ivan = await prisma.user.create({
    data: { name: 'Иван', initials: 'ИП', avatarColor: 'oklch(55% .13 70)', email: 'ivan@example.com' }
  });
  const nadya = await prisma.user.create({
    data: { name: 'Надя', initials: 'НД', avatarColor: 'oklch(58% .14 152)', email: 'nadya@example.com' }
  });
  const roman = await prisma.user.create({
    data: { name: 'Роман', initials: 'РС', avatarColor: 'oklch(52% .12 220)', email: 'roman@example.com' }
  });

  const trip = await prisma.trip.create({
    data: {
      name: 'Албания',
      country: 'Albania',
      route: 'Тирана → Берат',
      duration: 4,
      totalBudget: 1800,
      currency: 'EUR',
    }
  });

  await prisma.tripParticipant.createMany({
    data: [
      { tripId: trip.id, userId: alina.id, role: 'OWNER' },
      { tripId: trip.id, userId: maxim.id, role: 'MEMBER' },
      { tripId: trip.id, userId: sveta.id, role: 'MEMBER' },
      { tripId: trip.id, userId: ivan.id, role: 'MEMBER' },
      { tripId: trip.id, userId: nadya.id, role: 'MEMBER' },
      { tripId: trip.id, userId: roman.id, role: 'MEMBER' },
    ]
  });

  // Create Days
  const d1 = await prisma.day.create({
    data: { tripId: trip.id, dayNumber: 1, title: 'Тирана · приезд', subtitle: 'Перелёт, отель, центр', tip: 'Сразу сохраните офлайн-доступ к отельному ваучеру и перелётным PDF.' }
  });
  const d2 = await prisma.day.create({
    data: { tripId: trip.id, dayNumber: 2, title: 'Тирана', subtitle: 'Музеи, Bunker, Блоку', tip: 'Центр удобно проходится пешком, а Bolt лучше держать как резерв.' }
  });
  const d3 = await prisma.day.create({
    data: { tripId: trip.id, dayNumber: 3, title: 'Берат', subtitle: 'Переезд, крепость, ужин', tip: 'В крепости связь может проседать — офлайн-маршрут и документы must-have.' }
  });
  const d4 = await prisma.day.create({
    data: { tripId: trip.id, dayNumber: 4, title: 'Отъезд', subtitle: 'Горица, авто, аэропорт', tip: 'Проверьте, чтобы у всех были скачаны обратные билеты и документы аренды.' }
  });

  // Create Activities
  await prisma.activity.createMany({
    data: [
      { dayId: d1.id, time: '08:00', category: 'Транспорт', title: 'Вылет из Москвы', description: 'Прибытие в аэропорт Тирана-Ринас утром, далее такси до центра.', tags: 'Рейс,2.5 ч', order: 1, latitude: 41.4147, longitude: 19.7206, locationQuery: null },
      { dayId: d1.id, time: '11:30', category: 'Отель', title: 'Hotel Tirana International', description: 'База на первые 2 дня. Площадь Скандербега в 3 минутах.', tags: 'Check-in,Центр', order: 2, latitude: 41.3275, longitude: 19.8189, locationQuery: 'Hotel Tirana International, Tirana, Albania' },
      { dayId: d1.id, time: '13:30', category: 'Прогулка', title: 'Площадь Скандербега', description: 'Короткий адаптационный маршрут после перелёта.', tags: 'Пешком,Day 1', order: 3, latitude: 41.3275, longitude: 19.8187, locationQuery: 'Skanderbeg Square, Tirana, Albania' },
      { dayId: d1.id, time: '19:00', category: 'Ужин', title: 'Komiteti Kafe Muzeum', description: 'Первый общий ужин в локальной атмосфере.', tags: '€5–10,Без брони', order: 4, latitude: 41.3268, longitude: 19.8206, locationQuery: 'Komiteti Kafe Muzeum, Tirana, Albania' },
      
      { dayId: d2.id, time: '09:00', category: 'Музей', title: 'Национальный исторический музей', description: 'Быстрый культурный слот утром.', tags: '€3,1.5 ч', order: 1, latitude: 41.3283, longitude: 19.8181, locationQuery: 'National History Museum, Tirana, Albania' },
      { dayId: d2.id, time: '11:00', category: 'Арт', title: 'Bunker Art 2', description: 'Атмосферное место и контраст к прогулке по городу.', tags: '€5,История', order: 2, latitude: 41.3258, longitude: 19.8142, locationQuery: "Bunk'Art 2, Tirana, Albania" },
      { dayId: d2.id, time: '13:00', category: 'Обед', title: 'Mullixhiu', description: 'Бронь на 6 подтверждена. Главное гастро-место маршрута.', tags: 'Бронь,~€25', order: 3, latitude: 41.3255, longitude: 19.8245, locationQuery: 'Mullixhiu Restaurant, Tirana, Albania' },
      { dayId: d2.id, time: '15:30', category: 'Квартал', title: 'Блоку', description: 'Кафе, прогулка, короткие остановки и свободное время.', tags: '2 ч,Пешком', order: 4, latitude: 41.3233, longitude: 19.8211, locationQuery: 'Blloku neighborhood, Tirana, Albania' },
      { dayId: d2.id, time: '17:30', category: 'Парк', title: 'Большой парк Тираны', description: 'Передышка перед ужином.', tags: 'Бесплатно', order: 5, latitude: 41.3185, longitude: 19.8213, locationQuery: 'Grand Park of Tirana, Albania' },
      { dayId: d2.id, time: '20:00', category: 'Ужин', title: 'Era Restaurant', description: 'Спокойный финал дня в центре.', tags: '€15–20', order: 6, latitude: 41.3262, longitude: 19.8198, locationQuery: 'Era Restaurant, Tirana, Albania' },
      
      { dayId: d3.id, time: '09:00', category: 'Транспорт', title: 'Автобус Тирана → Берат', description: 'Переезд утром, билеты сохранены в документах.', tags: '€3,2.5 ч', order: 1, latitude: 41.3275, longitude: 19.8189, locationQuery: null },
      { dayId: d3.id, time: '12:00', category: 'Отель', title: 'Hotel Mangalemi', description: 'Исторический квартал, атмосфера и обзорный вид.', tags: 'Подтверждено', order: 2, latitude: 40.7060, longitude: 19.8525, locationQuery: 'Hotel Mangalemi, Berat, Albania' },
      { dayId: d3.id, time: '13:30', category: 'Обед', title: 'Ura Gorica', description: 'Спокойный обед перед основной прогулкой.', tags: '~€18', order: 3, latitude: 40.7042, longitude: 19.8490, locationQuery: 'Ura Gorica Restaurant, Berat, Albania' },
      { dayId: d3.id, time: '15:00', category: 'Место', title: 'Крепость Берат', description: 'Главный блок дня. Закладывайте 2–3 часа и время на закат.', tags: '€2,Sunset', order: 4, latitude: 40.7083, longitude: 19.8525, locationQuery: 'Berat Castle, Albania' },
      { dayId: d3.id, time: '19:30', category: 'Ужин', title: 'Квартал Мангалем', description: 'Домашние семейные рестораны на финал дня.', tags: '€10–12', order: 5, latitude: 40.7055, longitude: 19.8518, locationQuery: 'Mangalem Quarter, Berat, Albania' },
      
      { dayId: d4.id, time: '09:00', category: 'Прогулка', title: 'Квартал Горица', description: 'Лёгкий финальный утренний слот.', tags: '1 ч', order: 1, latitude: 40.7020, longitude: 19.8545, locationQuery: 'Gorica Quarter, Berat, Albania' },
      { dayId: d4.id, time: '11:00', category: 'Транспорт', title: 'Аренда авто', description: 'Маршрут обратно через нужные stop\'ы. Документы аренды загружены.', tags: '€80,PDF', order: 2, latitude: 40.7060, longitude: 19.8525, locationQuery: null },
      { dayId: d4.id, time: '18:00', category: 'Вылет', title: 'Вылет из Тираны', description: 'Лучше быть в аэропорту заранее.', tags: 'Airport,Return', order: 3, latitude: 41.4147, longitude: 19.7206, locationQuery: 'Tirana International Airport Nënë Tereza, Albania' },
    ]
  });

  // Places
  await prisma.place.createMany({
    data: [
      { tripId: trip.id, name: 'Mullixhiu', category: 'RESTAURANT', description: 'Авторская албанская кухня в Тиране. Хорошо для общего обеда.', tags: 'Бронь на 6,~€25,День 2' },
      { tripId: trip.id, name: 'Ura Gorica', category: 'RESTAURANT', description: 'У моста в Берате. Подходит для спокойного обеда перед крепостью.', tags: '~€18,Берат,День 3' },
      { tripId: trip.id, name: 'Крепость Берат', category: 'SPOT', description: 'Главная точка поездки: живые дома внутри крепости и лучший закат.', tags: '€2 вход,2–3 часа,Закат' },
      { tripId: trip.id, name: 'Komiteti Kafe', category: 'COFFEE', description: 'Атмосферное место для первого вечера в Тиране.', tags: 'Byrek,Ракыя,День 1' },
      { tripId: trip.id, name: 'Аптека у отеля', category: 'PRACTICAL', description: '24/7 аптека в 6 минутах пешком от Hotel Tirana International.', tags: '24/7,Тирана,Заметка Светы' },
      { tripId: trip.id, name: 'Обмен валюты', category: 'PRACTICAL', description: 'EUR → ALL. Наличные пригодятся вне крупных туристических точек.', tags: 'Леки,Аэропорт,День 1' },
    ]
  });

  // Documents
  await prisma.document.createMany({
    data: [
      { tripId: trip.id, uploadedById: alina.id, title: 'Авиабилеты Москва → Тирана', fileName: 'tickets.pdf', fileType: 'PDF', category: 'TICKETS', isOfflineAvailable: true },
      { tripId: trip.id, uploadedById: alina.id, title: 'Hotel Tirana International', fileName: 'hotel_tirana.png', fileType: 'IMG', category: 'HOTELS', isOfflineAvailable: true },
      { tripId: trip.id, uploadedById: alina.id, title: 'Hotel Mangalemi · Берат', fileName: 'hotel_berat.pdf', fileType: 'PDF', category: 'HOTELS', isOfflineAvailable: true },
      { tripId: trip.id, uploadedById: ivan.id, title: 'Билеты Тирана → Берат', fileName: 'bus_tickets.jpg', fileType: 'IMG', category: 'TRANSPORT', isOfflineAvailable: true },
      { tripId: trip.id, uploadedById: alina.id, title: 'Страховка', fileName: 'insurance.pdf', fileType: 'PDF', category: 'OTHER', isOfflineAvailable: true },
      { tripId: trip.id, uploadedById: maxim.id, title: 'Аренда авто · день 4', fileName: 'car_rental.pdf', fileType: 'PDF', category: 'TRANSPORT', isOfflineAvailable: true },
    ]
  });

  // Chat Messages
  await prisma.chatMessage.createMany({
    data: [
      { tripId: trip.id, senderId: maxim.id, content: 'Подтвердил бронь в Mullixhiu на 13:00.' },
      { tripId: trip.id, senderId: sveta.id, content: 'Добавьте аптеку около отеля в practical info.' },
      { tripId: trip.id, senderId: alina.id, content: 'Добавила. И загружу автобусные билеты в документы.' },
      { tripId: trip.id, senderId: ivan.id, content: 'Если увидите нормальный обменник — сохраните, пожалуйста.' },
    ]
  });

  // Notes
  await prisma.note.createMany({
    data: [
      { tripId: trip.id, authorId: alina.id, title: 'Документы', content: 'Все важные PDF и ваучеры должны быть доступны офлайн.' },
      { tripId: trip.id, authorId: alina.id, title: 'Еда', content: 'Для Mullixhiu попросить стол у окна и уточнить vegetarian options.' },
      { tripId: trip.id, authorId: alina.id, title: 'Транспорт', content: 'Автобус до Берата лучше не откладывать на последний момент.' },
      { tripId: trip.id, authorId: alina.id, title: 'Практически', content: 'Сохранить аптеку, обменник и адреса отелей в офлайн-доступ.' },
    ]
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
