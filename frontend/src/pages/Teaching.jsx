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
      console.log("Publishing course", courseId, "->", newStatus);
      // API expects a boolean query param; pass boolean directly (not an object)
      await teachingApi.publishCourseFullCoursesCourseIdPublishPatch(courseId, newStatus);
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
    return <div className="flex items-center justify-center h-64">Загрузка курсов...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Ваши курсы</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddCourseForm(!showAddCourseForm)}
        >
          + Создать новый курс
        </button>
      </div>

      {/* Форма создания нового курса */}
      {showAddCourseForm && (
        <div className="card mb-6">
          <h3 className="text-xl font-bold mb-4">Создать новый курс</h3>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Название курса *</label>
            <input
              type="text"
              placeholder="Введите название курса"
              value={newCourse.name}
              onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Описание</label>
            <textarea
              rows="3"
              placeholder="Описание курса"
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Категория</label>
            <select
              value={newCourse.categoryId || ""}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  categoryId: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full p-2 border rounded"
            >
              <option value="">Выберите категорию (опционально)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowAddCourseForm(false);
                setNewCourse({ name: "", description: "", categoryId: null });
              }}
            >
              Отмена
            </button>
            <button type="button" className="btn btn-primary" onClick={handleCreateCourse}>
              Создать курс
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <p className="text-secondary col-span-full text-center py-8">Вы пока не ведёте ни один курс.</p>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="card p-0 overflow-hidden flex flex-col h-full">
              <div className="h-40 bg-gray-200 overflow-hidden relative">
                {course.picture ? (
                  <img
                    src={`/full/courses/${course.id}/picture`}
                    alt={course.name}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = "https://via.placeholder.com/400x150?text=No+Image")}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">Нет изображения</div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {course.isPublished ? "Опубликован" : "Черновик"}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Категория: {course.category?.name || "Без категории"}
                </p>
                <p className="text-gray-600 mb-4 flex-1">
                  {course.description?.length > 100
                    ? course.description.slice(0, 100) + "..."
                    : course.description || "Нет описания"}
                </p>
                
                <div className="flex justify-between items-center mb-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => handleTogglePublish(course.id, course.isPublished)}
                  >
                    {course.isPublished ? "Снять с публикации" : "Опубликовать"}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary flex-1"
                    onClick={() => handleEdit(course.id)}
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDelete(course.id)}
                  >
                    Удалить
                  </button>
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
