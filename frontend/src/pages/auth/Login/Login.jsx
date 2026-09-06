import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Logo from "../../../assets/Logo.png";
import './Login.scss';

import ilustracao from '../../../assets/harmony-produce.png';

export default function Login() {
  const [form, setForm] = useState({ email: '', senha: '' });
  const [showSenha, setShowSenha] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <div className="auth-layout">
      <aside
        className="auth-layout__brand"
        style={{ backgroundImage: `url(${ilustracao})` }}
      >
        <div className="auth-layout__overlay" />

        <div className="auth-layout__header">
          <img className="auth-layout__logo" src={Logo} alt="VittaFlow" />
        </div>

        <div className="auth-layout__copy">
          <h1 className="auth-layout__tagline">
            Reduza o desperdício.<br />
            Conecte alimentos a quem precisa.
          </h1>

          <span className="auth-layout__divider" />

          <p className="auth-layout__quote">
            Cada refeição resgatada é um gesto de cuidado — com as pessoas e
            com a terra.
          </p>
        </div>
      </aside>

      <main className="auth-layout__content">
        <form className="auth-card login-card" onSubmit={handleSubmit}>
          <h1 className="auth-card__title">Bem-vindo de volta</h1>
          <p className="auth-card__subtitle">
            Acesse sua conta e continue de onde parou.
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
            <div className="auth-card__label-row">
              <label className="auth-card__label" htmlFor="senha">
                Senha
              </label>
              <Link to="/esqueci-senha" className="auth-card__forgot">
                Esqueci minha senha
              </Link>
            </div>
            <div className="auth-card__input-wrapper">
              <input
                id="senha"
                type={showSenha ? 'text' : 'password'}
                placeholder="Pelo menos 6 caracteres"
                minLength={6}
                value={form.senha}
                onChange={handleChange('senha')}
                required
              />
              <button
                type="button"
                className="auth-card__toggle-visibility"
                onClick={() => setShowSenha((prev) => !prev)}
                aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {showSenha ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-card__submit">
            Entrar
          </button>

          <p className="auth-card__footer">
            Não tem conta?{' '}
            <Link to="/register" className="auth-card__footer-link">
              Criar nova conta
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}