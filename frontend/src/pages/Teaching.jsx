import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UsersApi, FullApi, TeachingApi } from "../api/index.js";

function MyTeachingCourses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ 
    name: "", 
    description: "", 
    categoryId: null 
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    const usersApi = new UsersApi();
    const fullApi = new FullApi();

    if (token) {
      usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
      fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const fetchData = async () => {
      try {
        // Загружаем категории
        const categoriesData = await fullApi.listCategoriesFullAdminCategoriesGet({});
        setCategories(categoriesData || []);

        // Загружаем курсы
        const coursesData = await usersApi.myTeachingCoursesUsersMeCoursesTeachingGet({});
        
        if (!coursesData || coursesData.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }

        // Подгружаем категории для каждого курса
        const coursesWithCategories = await Promise.all(
          coursesData.map(async (course) => {
            if (!course.categoryId) {
              return { ...course, category: { name: "Без категории" } };
            } else {
              try {
                const catData = await fullApi.getCategoryFullAdminCategoriesCatIdGet(course.categoryId);
                return { ...course, category: catData || { name: "Неизвестная категория" } };
              } catch (err) {
                console.error("Ошибка загрузки категории:", err);
                return { ...course, category: { name: "Неизвестная категория" } };
              }
            }
          })
        );

        setCourses(coursesWithCategories);
      } catch (err) {
        console.error("Ошибка при загрузке данных:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (courseId) => {
    navigate(`/courses/${courseId}/edit`);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("Вы уверены, что хотите удалить курс? Все модули, темы, тесты и материалы также будут удалены.")) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      await teachingApi.deleteCourseFullCoursesCourseIdDelete(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      alert("Курс удалён!");
    } catch (err) {
      console.error("Ошибка удаления курса:", err);
      alert("Не удалось удалить курс");
    }
  };

  const handleTogglePublish = async (courseId, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "опубликовать" : "снять с публикации";
    
    if (!window.confirm(`Вы уверены, что хотите ${action} этот курс?`)) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      await teachingApi.publishCourseFullCoursesCourseIdPublishPatch(courseId, { publish: newStatus });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, isPublished: newStatus } : c
        )
      );
      alert(`Курс ${newStatus ? "опубликован" : "снят с публикации"}!`);
    } catch (err) {
      console.error("Ошибка изменения статуса курса:", err);
      alert(`Не удалось ${action} курс`);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.name?.trim()) {
      alert("Название курса обязательно");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const teachingApi = new TeachingApi();
    const usersApi = new UsersApi();
    
    if (token) {
      teachingApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
      usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      // Получаем ID текущего пользователя
      const userData = await usersApi.meUsersMeGet();

      const courseData = await teachingApi.createCourseFullCoursesPost({
        name: newCourse.name.trim(),
        description: newCourse.description || "",
        categoryId: newCourse.categoryId ? Number(newCourse.categoryId) : null,
        authorId: userData.id, // Добавляем обязательное поле authorId
        picture: null, // Добавляем обязательное поле picture
      });

      // Загружаем категорию для нового курса
      let category = { name: "Без категории" };
      if (courseData.categoryId) {
        try {
          const fullApi = new FullApi();
          if (token) {
            fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
          }
          const catData = await fullApi.getCategoryFullAdminCategoriesCatIdGet(courseData.categoryId);
          category = catData || { name: "Неизвестная категория" };
        } catch (err) {
          console.error("Ошибка загрузки категории:", err);
        }
      }

      setCourses((prev) => [...prev, { ...courseData, category }]);
      setNewCourse({ name: "", description: "", categoryId: null });
      setShowAddCourseForm(false);
      alert("Курс создан!");
    } catch (err) {
      console.error("Ошибка создания курса:", err);
      alert("Не удалось создать курс");
    }
  };

  if (loading) {
    return <div className="loading">Загрузка курсов...</div>;
  }

  return (
    <div className="my-courses-page">
      <div className="courses-header">
        <h1 className="courses-title">Ваши курсы</h1>
        <button
          type="button"
          className="add-btn"
          onClick={() => setShowAddCourseForm(!showAddCourseForm)}
        >
          + Создать новый курс
        </button>
      </div>

      {/* Форма создания нового курса */}
      {showAddCourseForm && (
        <div className="add-course-form">
          <h3>Создать новый курс</h3>
          <label className="form-label">
            Название курса *
            <input
              type="text"
              className="form-input"
              placeholder="Введите название курса"
              value={newCourse.name}
              onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
            />
          </label>
          <label className="form-label">
            Описание
            <textarea
              className="form-input"
              rows="3"
              placeholder="Описание курса"
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
            />
          </label>
          <label className="form-label">
            Категория
            <select
              className="form-input"
              value={newCourse.categoryId || ""}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  categoryId: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">Выберите категорию (опционально)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowAddCourseForm(false);
                setNewCourse({ name: "", description: "", categoryId: null });
              }}
            >
              Отмена
            </button>
            <button type="button" className="btn-primary" onClick={handleCreateCourse}>
              Создать курс
            </button>
          </div>
        </div>
      )}

      <div className="my-courses-grid">
        {courses.length === 0 ? (
          <p className="no-courses">Вы пока не ведёте ни один курс.</p>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="course-card horizontal-card">
              <div className="course-image">
                {course.picture ? (
                  <img
                    src={`/full/courses/${course.id}/picture`}
                    alt={course.name}
                    onError={(e) => (e.target.src = "/default.png")}
                  />
                ) : (
                  <div className="course-image-placeholder">Нет изображения</div>
                )}
              </div>
              <div className="course-content">
                <h3>{course.name}</h3>
                <p className="course-category">
                  Категория: {course.category?.name || "Без категории"}
                </p>
                <p className="course-desc">
                  {course.description?.length > 100
                    ? course.description.slice(0, 100) + "..."
                    : course.description || "Нет описания"}
                </p>
                <div className="course-footer">
                  {/* Статус курса с возможностью изменения */}
                  <div className="course-status-section">
                    <span className="course-status">
                      Статус: {course.isPublished ? "Опубликован" : "Черновик"}
                    </span>
                    <button
                      type="button"
                      className={`btn-toggle-status ${course.isPublished ? "btn-unpublish" : "btn-publish"}`}
                      onClick={() => handleTogglePublish(course.id, course.isPublished)}
                      title={course.isPublished ? "Снять с публикации" : "Опубликовать"}
                    >
                      {course.isPublished ? "📤 Снять с публикации" : "📢 Опубликовать"}
                    </button>
                  </div>

                  {/* Кнопки действий */}
                  <div className="course-actions">
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => handleEdit(course.id)}
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleDelete(course.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyTeachingCourses;
