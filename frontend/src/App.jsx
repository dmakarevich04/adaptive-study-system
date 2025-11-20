import React, { createContext, useState, useContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import CoursesList from "./pages/CoursesList.jsx";
import CourseInfo from "./pages/CourseInfo.jsx";
import MyCourses from "./pages/MyCourses.jsx"
import Teaching from "./pages/Teaching.jsx"
import { UsersApi } from "./api/index.js";
import CourseEdit from "./pages/CourseEdit.jsx";
import TestEdit from "./pages/TestEdit.jsx";
import Studying from "./pages/Studying.jsx";
import TopicStudying from "./pages/TopicStudying.jsx";
import TestTaking from "./pages/TestTaking.jsx";
export const UserContext = createContext();
const usersApi = new UsersApi();

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setLoadingUser(false);
      return;
    }

    usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;

    usersApi.meUsersMeGet()
      .then((data) => {
        if (data) {
          setUser(data);
        } else {
          localStorage.removeItem("jwtToken");
          usersApi.apiClient.defaultHeaders["Authorization"] = "";
        }
        setLoadingUser(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки пользователя:", err);
        localStorage.removeItem("jwtToken");
        usersApi.apiClient.defaultHeaders["Authorization"] = "";
        setLoadingUser(false);
      });
  }, []);

  if (loadingUser) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="app-container">
      <UserContext.Provider value={{ user, setUser }}>
        <Router>
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<CoursesList />} />
              <Route path="/courses/:courseId" element={<CourseInfo />} />
              <Route path="/courses/:courseId/studying" element={<Studying />} />
              <Route path="/courses/:courseId/topics/:topicId/studying" element={<TopicStudying />} />
              <Route path="/courses/:courseId/tests/:testId/take" element={<TestTaking />} />
              <Route path="/teaching" element={<Teaching />} />
              <Route path="/my-learning" element={<MyCourses />} />
              <Route path="/courses/:courseId/edit" element={<CourseEdit />} />
              <Route path="courses/:courseId/tests/:testId/edit" element={<TestEdit />} />
            </Routes>
          </main>
          <footer>© 2025 Adaptive Study Platform</footer>
        </Router>
      </UserContext.Provider>
    </div>
  );
}

// --- Компонент Header ---
function Header() {
  const { user } = useContext(UserContext);
  return (
    <header className="header">
      <div className="logo-block">
        <img src="" alt="Лого" />
        <span>EduFlex</span>
      </div>

      {user && (
        <nav className="nav">
          <NavLink to="/courses" className="nav-link">Курсы</NavLink>
          {user.roleId === 1 && <NavLink to="/my-learning" className="nav-link">Моё обучение</NavLink>}
          {user.roleId === 2 && <NavLink to="/teaching" className="nav-link">Преподавание</NavLink>}
        </nav>
      )}

      {user && <LogoutButton />}
    </header>
  );
}

// --- Компонент LogoutButton ---
function LogoutButton() {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    usersApi.logoutUsersLogoutPost()
      .then(() => {
        console.log("Выход выполнен");
      })
      .catch((err) => {
        console.error("Ошибка при выходе:", err);
      })
      .finally(() => {
        localStorage.removeItem("jwtToken");
        usersApi.apiClient.defaultHeaders["Authorization"] = "";
        setUser(null);
        navigate("/");
      });
  };

  return <button className="logout-btn" onClick={handleLogout}>Выйти</button>;
}

// --- Компонент Placeholder ---
function Placeholder({ title }) {
  return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>
      <h1>{title}</h1>
      <p>Раздел в разработке.</p>
    </div>
  );
}

export default App;
