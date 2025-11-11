import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeachingApi, FullApi } from "../api/index.js";
import "../styles/courses_list.css";

const teachingApi = new TeachingApi();
const fullApi = new FullApi();

function CoursesList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    teachingApi.listCoursesFullCoursesGet({ published: true }, (err, coursesData) => {
      if (err) {
        console.error("Ошибка при загрузке курсов:", err);
        setLoading(false);
        return;
      }

      if (!coursesData || coursesData.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      // Подгружаем категории для каждого курса
      const coursesWithCategories = coursesData.map(course => {
        return new Promise(resolve => {
          if (!course.categoryId) {
            resolve({ ...course, category: { name: "Без категории" } });
          } else {
            fullApi.getCategoryFullAdminCategoriesCatIdGet(course.categoryId, (err, catData) => {
              resolve({
                ...course,
                category: err ? { name: "Неизвестная категория" } : catData
              });
            });
          }
        });
      });

      Promise.all(coursesWithCategories).then(results => {
        setCourses(results);
        setLoading(false);
      });
    });
  }, []);

  if (loading) {
    return <div className="loading">Загрузка курсов...</div>;
  }

  return (
    <div className="courses-page">
      <h1 className="courses-title">Все курсы</h1>
      <div className="courses-grid">
        {courses.length === 0 ? (
          <p className="no-courses">Пока нет доступных курсов.</p>
        ) : (
          courses.map(course => (
            <div
              key={course.id}
              className="course-card"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <div className="course-image">
                <img
                  src={`http://localhost:8000/${course.picture}`}
                  alt={course.name}
                  onError={e => (e.target.src = "/default.png")}
                />
              </div>
              <div className="course-content">
                <h3>{course.name}</h3>
                <p className="course-category">
                  Категория: {course.category?.name || "Без категории"}
                </p>
                <p className="course-desc">
                  {course.description.length > 100
                    ? course.description.slice(0, 100) + "..."
                    : course.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CoursesList;
