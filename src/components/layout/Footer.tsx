export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-border-default bg-bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Logo & description */}
          <div>
            <a href="/" className="text-xl font-bold neon-text text-accent inline-flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
              </div>
              Студия ЧЕ
            </a>
            <p className="text-text-muted text-sm leading-relaxed">
              Обучающая платформа по видеопроизводству, нейросетям и ИИ-инструментам для бизнеса.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Навигация</h3>
            <div className="space-y-2">
              <a href="/#courses" className="block text-text-muted hover:text-accent transition-colors text-sm">
                Каталог курсов
              </a>
              <a href="/auth/login" className="block text-text-muted hover:text-accent transition-colors text-sm">
                Войти
              </a>
              <a href="/auth/register" className="block text-text-muted hover:text-accent transition-colors text-sm">
                Регистрация
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Документы</h3>
            <div className="space-y-2">
              <p className="text-text-muted text-sm">ИНН: 000000000000</p>
              <a href="#" className="block text-text-muted hover:text-accent transition-colors text-sm">
                Договор оферты
              </a>
              <a href="#" className="block text-text-muted hover:text-accent transition-colors text-sm">
                Политика конфиденциальности
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border-default text-center text-text-muted text-sm">
          &copy; {new Date().getFullYear()} Студия ЧЕ. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
