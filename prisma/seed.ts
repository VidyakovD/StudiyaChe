import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin account
  const adminPassword = await hash("28371988", 12);
  const admin = await prisma.user.upsert({
    where: { email: "vidyakov@studiache.ru" },
    update: {},
    create: {
      name: "Vidyakov",
      nickname: "Vidyakov",
      email: "vidyakov@studiache.ru",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log("Admin created:", admin.email);

  // Categories
  const catVideo = await prisma.category.upsert({
    where: { slug: "videomontazh" },
    update: {},
    create: { name: "Видеомонтаж", slug: "videomontazh" },
  });

  const catAi = await prisma.category.upsert({
    where: { slug: "ii-generacii" },
    update: {},
    create: { name: "ИИ генерации", slug: "ii-generacii" },
  });

  const catBiz = await prisma.category.upsert({
    where: { slug: "ii-dlya-biznesa" },
    update: {},
    create: { name: "ИИ для бизнеса", slug: "ii-dlya-biznesa" },
  });
  console.log("Categories created");

  // Courses
  const course1 = await prisma.course.upsert({
    where: { id: "course-premiere" },
    update: {},
    create: {
      id: "course-premiere",
      title: "Основы видеомонтажа в Premiere Pro",
      description: "Полный курс по Adobe Premiere Pro с нуля. Научишься монтировать видео профессионально: таймлайн, цветокоррекция, звук, переходы, экспорт. 12 практических уроков с домашними заданиями.",
      price: 4990,
      categoryId: catVideo.id,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: "course-ae" },
    update: {},
    create: {
      id: "course-ae",
      title: "Продвинутый After Effects",
      description: "VFX, моушн-дизайн и визуальные эффекты в After Effects. Создание анимаций, работа с масками, трекинг, выражения, плагины. Для тех, кто хочет выйти на новый уровень.",
      price: 7990,
      categoryId: catVideo.id,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { id: "course-runway" },
    update: {},
    create: {
      id: "course-runway",
      title: "Генерация видео через Runway ML",
      description: "Создавай видео с помощью нейросетей! Gen-2, Gen-3, text2vid, img2vid. Промпт-инжиниринг, стили, работа с ключевыми кадрами. Магия ИИ-видеопродакшена.",
      price: 5990,
      categoryId: catAi.id,
    },
  });

  const course4 = await prisma.course.upsert({
    where: { id: "course-midjourney" },
    update: {},
    create: {
      id: "course-midjourney",
      title: "Midjourney для видеопродакшена",
      description: "Генерация стильных изображений для видеопроектов. Промпт-инжиниринг, стили, параметры, upscale. Создание превью, обложек, раскадровок с помощью ИИ.",
      price: 6490,
      categoryId: catAi.id,
    },
  });

  const course5 = await prisma.course.upsert({
    where: { id: "course-chatgpt" },
    update: {},
    create: {
      id: "course-chatgpt",
      title: "ChatGPT для бизнес-контента",
      description: "Автоматизация создания контента с помощью ChatGPT. Сценарии, субтитры, посты, описания. Воронки продаж и чат-боты для бизнеса. Экономь десятки часов.",
      price: 8990,
      categoryId: catBiz.id,
    },
  });

  const course6 = await prisma.course.upsert({
    where: { id: "course-ai-auto" },
    update: {},
    create: {
      id: "course-ai-auto",
      title: "ИИ-автоматизация для продакшена",
      description: "Продвинутый курс по автоматизации видеопродакшена. ElevenLabs, Whisper, HeyGen, автоматические субтитры, AI-озвучка. Полный цикл от идеи до публикации.",
      price: 9990,
      categoryId: catBiz.id,
      recommendedCourseId: course3.id,
      discountPercent: 15,
    },
  });
  console.log("Courses created");

  // Lessons for Course 1 (Premiere Pro)
  const premiereLessons = [
    { title: "Знакомство с интерфейсом Premiere Pro", description: "Обзор рабочего пространства, панели, настройки проекта.", homework: "Создайте новый проект и изучите расположение всех панелей." },
    { title: "Импорт и организация материалов", description: "Импорт видео, аудио и изображений. Bins, метки, поиск.", homework: "Импортируйте 5 разных файлов и организуйте их по папкам." },
    { title: "Базовый монтаж и таймлайн", description: "Работа с таймлайном, резка, перемещение клипов, Razor Tool.", homework: "Смонтируйте короткий ролик из предоставленных материалов." },
    { title: "Работа со звуком", description: "Аудиодорожки, громкость, ключевые кадры звука, эффекты.", homework: "Добавьте фоновую музыку и настройте уровни громкости." },
    { title: "Цветокоррекция", description: "Lumetri Color, баланс белого, контраст, LUTs.", homework: "Сделайте цветокоррекцию трёх разных клипов." },
    { title: "Титры и текст", description: "Essential Graphics, шаблоны, анимация текста.", homework: "Создайте интро с анимированным текстом." },
    { title: "Переходы и эффекты", description: "Встроенные переходы, Motion, Opacity, маски.", homework: "Добавьте 5 разных переходов между клипами." },
    { title: "Скорость и замедление", description: "Speed/Duration, Time Remapping, замедление.", homework: "Создайте эффект замедления в динамичной сцене." },
    { title: "Многокамерный монтаж", description: "Multi-Camera editing, синхронизация, переключение.", homework: "Смонтируйте многокамерный диалог." },
    { title: "Экспорт и форматы", description: "Media Encoder, кодеки H.264/H.265, настройки для YouTube.", homework: "Экспортируйте ролик в 3 разных формата." },
    { title: "Оптимизация рабочего процесса", description: "Горячие клавиши, прокси, пресеты, производительность.", homework: "Настройте 10 своих горячих клавиш для быстрого монтажа." },
    { title: "Финальный проект", description: "Создание полноценного ролика от начала до конца.", homework: "Смонтируйте 2-3 минутный ролик с использованием всех изученных техник." },
  ];

  for (let i = 0; i < premiereLessons.length; i++) {
    await prisma.lesson.upsert({
      where: { courseId_order: { courseId: course1.id, order: i + 1 } },
      update: {},
      create: {
        courseId: course1.id,
        title: premiereLessons[i].title,
        description: premiereLessons[i].description,
        homework: premiereLessons[i].homework,
        order: i + 1,
      },
    });
  }
  console.log("Lessons created for Premiere Pro course");

  // Lessons for Course 3 (Runway ML)
  const runwayLessons = [
    { title: "Введение в ИИ-генерацию видео", description: "Обзор инструментов: Runway, Sora, Kling, Pika." },
    { title: "Регистрация и интерфейс Runway ML", description: "Создание аккаунта, обзор функций, тарифы." },
    { title: "Text-to-Video: основы промптинга", description: "Как писать промпты для генерации видео из текста." },
    { title: "Image-to-Video: оживляем картинки", description: "Генерация видео из статичных изображений." },
    { title: "Работа с ключевыми кадрами", description: "Контроль движения камеры и объектов." },
    { title: "Стили и эстетика", description: "Кинематографичность, стилизация, референсы." },
    { title: "Пост-обработка сгенерированного видео", description: "Улучшение качества, монтаж, compositing." },
    { title: "Финальный проект: ИИ-клип", description: "Создание полноценного видеоролика с помощью ИИ." },
  ];

  for (let i = 0; i < runwayLessons.length; i++) {
    await prisma.lesson.upsert({
      where: { courseId_order: { courseId: course3.id, order: i + 1 } },
      update: {},
      create: {
        courseId: course3.id,
        title: runwayLessons[i].title,
        description: runwayLessons[i].description,
        order: i + 1,
      },
    });
  }
  console.log("Lessons created for Runway ML course");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
