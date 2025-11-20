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
      <div className="welcome">
        <h1>Добро пожаловать, {user.name} {user.surname}!</h1>
        <p>Вот твои адаптивные курсы и рекомендации.</p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className={`form-container ${mode === "register" ? "shift" : ""}`}>
          {/* ВХОД */}
          <div className="form login-form">
            <h2>Вход</h2>
            {error && mode === "login" && <p className="error">{error}</p>}
            <input
              placeholder="Email / Логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
            />
            <input
              placeholder="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
            />
            <button onClick={handleLogin} type="button">Войти</button>
            <p>
              Нет аккаунта?{" "}
              <span 
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                style={{ cursor: "pointer", color: "#007bff" }}
              >
                Зарегистрироваться
              </span>
            </p>
          </div>

          {/* РЕГИСТРАЦИЯ */}
          <div className="form register-form">
            <h2>Регистрация</h2>
            {error && mode === "register" && <p className="error">{error}</p>}
            <input
              placeholder="Email"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleRegister();
              }}
            />
            <input
              placeholder="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleRegister();
              }}
            />
            <input
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleRegister();
              }}
            />
            <input
              placeholder="Фамилия"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleRegister();
              }}
            />
            <button onClick={handleRegister} type="button">Создать аккаунт</button>
            <p>
              Уже зарегистрированы?{" "}
              <span 
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                style={{ cursor: "pointer", color: "#007bff" }}
              >
                Войти
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
