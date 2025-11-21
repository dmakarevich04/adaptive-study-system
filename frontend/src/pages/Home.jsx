import React, { useContext, useState, useEffect } from "react";
import { UsersApi, UserCreate, LoginIn } from "../api/index.js";
import { UserContext } from "../App";

const usersApi = new UsersApi();

function Home() {
  const { user, setUser } = useContext(UserContext);
  const [mode, setMode] = useState("login"); // login | register
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    usersApi.meUsersMeGet()
      .then((userData) => {
        setUser(userData);
      })
      .catch((err) => {
        console.error("Ошибка загрузки пользователя:", err);
        localStorage.removeItem("jwtToken");
        usersApi.apiClient.defaultHeaders["Authorization"] = "";
        setUser(null);
      });
  }, [setUser]);

  const handleRegister = () => {
    if (!login || !password || !name || !surname) {
      setError("Все поля обязательны");
      return;
    }

    const newUser = new UserCreate(login, password, name, surname);
    usersApi.registerUsersRegisterPost(newUser)
      .then(() => {
        setError("");
        handleLogin();
      })
      .catch((err) => {
        console.error("Ошибка регистрации:", err);
        setError("Ошибка регистрации или пользователь уже существует");
      });
  };

  const handleLogin = () => {
    if (!login || !password) {
      setError("Введите логин и пароль");
      return;
    }

    const loginData = new LoginIn(login, password);
    usersApi.loginUsersLoginPost(loginData)
      .then((tokenData) => {
        if (!tokenData || !tokenData.access_token) {
          setError("Неверный логин или пароль");
          return;
        }
        setError("");
        localStorage.setItem("jwtToken", tokenData.access_token);
        usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${tokenData.access_token}`;
        return usersApi.meUsersMeGet();
      })
      .then((userData) => {
        if (userData) {
          setUser(userData);
        }
      })
      .catch((err) => {
        console.error("Ошибка входа:", err);
        setError("Неверный логин или пароль");
      });
  };

  if (user) {
    return (
      <div className="text-center mt-4">
        <h1>Добро пожаловать, {user.name} {user.surname}!</h1>
        <p className="text-secondary">Вот твои адаптивные курсы и рекомендации.</p>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="card">
        {mode === "login" ? (
          <div className="form login-form">
            <h2 className="text-center">Вход</h2>
            {error && <p className="text-center" style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>}
            <div className="mb-4">
              <label>Email / Логин</label>
              <input
                placeholder="Email / Логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
              />
            </div>
            <div className="mb-4">
              <label>Пароль</label>
              <input
                placeholder="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={handleLogin} type="button">Войти</button>
            <p className="text-center">
              Нет аккаунта?{" "}
              <span 
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                style={{ cursor: "pointer", color: "var(--primary-color)", fontWeight: 500 }}
              >
                Зарегистрироваться
              </span>
            </p>
          </div>
        ) : (
          <div className="form register-form">
            <h2 className="text-center">Регистрация</h2>
            {error && <p className="text-center" style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>}
            <div className="mb-4">
              <label>Email</label>
              <input
                placeholder="Email"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleRegister();
                }}
              />
            </div>
            <div className="mb-4">
              <label>Пароль</label>
              <input
                placeholder="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleRegister();
                }}
              />
            </div>
            <div className="mb-4">
              <label>Имя</label>
              <input
                placeholder="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleRegister();
                }}
              />
            </div>
            <div className="mb-4">
              <label>Фамилия</label>
              <input
                placeholder="Фамилия"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleRegister();
                }}
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={handleRegister} type="button">Создать аккаунт</button>
            <p className="text-center">
              Уже зарегистрированы?{" "}
              <span 
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                style={{ cursor: "pointer", color: "var(--primary-color)", fontWeight: 500 }}
              >
                Войти
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
