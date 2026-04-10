import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 relative z-10 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="gradient-border p-8 md:p-12">
            <div className="card-glow" />
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] bg-clip-text text-transparent">
                Политика конфиденциальности
              </h1>

              <div className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
                <section>
                  <h2 className="text-lg font-bold text-[var(--accent)] mb-3">1. Общие положения</h2>
                  <p>Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей обучающей платформы «Студия ЧЕ» (далее — «Платформа»), принадлежащей ИП Видяков Денис Константинович.</p>
                  <p className="mt-2">Регистрация на Платформе и использование её сервисов означает безоговорочное согласие Пользователя с настоящей Политикой конфиденциальности и условиями обработки его персональных данных.</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-[var(--accent)] mb-3">2. Какие данные мы собираем</h2>
                  <p>При регистрации и использовании Платформы мы собираем:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-[var(--text-muted)]">
                    <li>Имя (ФИО)</li>
                    <li>Адрес электронной почты</li>
                    <li>Ник и аватар (при заполнении профиля)</li>
                    <li>Данные о приобретённых курсах и прогрессе обучения</li>
                    <li>Сообщения в чатах курсов</li>
                    <li>Техническую информацию (IP-адрес, тип браузера, время посещения)</li>
                  </ul>
                  <p className="mt-2">Платёжные данные обрабатываются исключительно платёжным оператором ЮKassa и не хранятся на серверах Платформы.</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-[var(--accent)] mb-3">3. Цели обработки данных</h2>
                  <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
                    <li>Предоставление доступа к приобретённым курсам</li>
                    <li>Идентификация пользователя в личном кабинете и чатах</li>
                    <li>Направление кассовых чеков в соответствии с ФЗ №54-ФЗ</li>
                    <li>Уведомления о покупках и доступе к курсам</li>
                    <li>Улучшение качества сервиса</li>
                    <li>Исполнение обязательств по договору оферты</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-[var(--accent)] mb-3">4. Защита данных</h2>
                  <p>Мы принимаем необходимые организационные и технические меры для защиты персональных данных от неправомерного доступа, уничтожения, изменения, блокирования, копирования, распространения.</p>
                  <p className="mt-2">Данные хранятся на серверах, расположенных на территории Российской Федерации, в соответствии с требованиями ст. 18 ФЗ №152-ФЗ «О персональных данных».</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-[var(--accent)] mb-3">5. Передача данных третьим лицам</h2>
                  <p>Мы не передаём персональные данные третьим лицам, за исключением случаев:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-[var(--text-muted)]">
                    <li>Обработка платежей через ЮKassa</li>
                    <li>Требования законодательства Российской Федерации</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-[var(--accent)] mb-3">6. Cookies</h2>
                  <p>Платформа использует cookies для обеспечения работы авторизации и улучшения пользовательского опыта. Вы можете отключить cookies в настройках браузера, однако это может повлиять на функциональность Платформы.</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-[var(--accent)] mb-3">7. Права пользователя</h2>
                  <p>Пользователь имеет право:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-[var(--text-muted)]">
                    <li>Получить информацию о хранящихся персональных данных</li>
                    <li>Потребовать уточнения, блокирования или уничтожения данных</li>
                    <li>Отозвать согласие на обработку персональных данных</li>
                  </ul>
                  <p className="mt-2">Для реализации указанных прав направьте обращение в службу поддержки.</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-[var(--accent)] mb-3">8. Удаление данных</h2>
                  <p>Пользователь вправе в любой момент запросить удаление своих персональных данных, направив обращение в службу поддержки. Удаление производится в течение 30 дней с момента получения запроса.</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-[var(--accent)] mb-3">9. Изменения политики</h2>
                  <p>Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности. Актуальная версия всегда размещена на данной странице. Продолжение использования Платформы после внесения изменений означает согласие с новой редакцией.</p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-[var(--accent)] mb-3">10. Контакты</h2>
                  <p>ИП Видяков Денис Константинович</p>
                  <p className="text-[var(--text-muted)] mt-1">По вопросам обработки персональных данных обращайтесь в службу поддержки Платформы.</p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
