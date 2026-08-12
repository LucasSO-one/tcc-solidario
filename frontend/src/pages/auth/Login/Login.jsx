import { useState } from 'react';
import Logo from "../../../assets/Logo.png";
import './Login.scss';

export default function Login() {
  const [form, setForm] = useState({ email: '', senha: '' });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <div className="auth-layout">
      <aside className="auth-layout__brand">
        <h1 className="brand-title">
          <img src={Logo} alt="VittaFlow"></img>
        </h1>
        <p className="auth-layout__tagline">
          Reduza o desperdício. Conecte alimentos a quem precisa.
        </p>
      </aside>

      <main className="auth-layout__content">
        <form className="auth-card login-card" onSubmit={handleSubmit}>
          <h1 className="auth-card__title">Entrar</h1>
          <p className="auth-card__subtitle">
            Acesse sua conta para continuar
          </p>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handleChange('email')}
              required
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              placeholder="Pelo menos 6 caracteres"
              minLength={6}
              value={form.senha}
              onChange={handleChange('senha')}
              required
            />
          </div>

          <button type="submit" className="auth-card__submit">
            Entrar
          </button>

          <p className="auth-card__footer">
            Não tem conta? <a href="/register">Criar nova conta</a>
          </p>
        </form>
      </main>
    </div>
  );
}