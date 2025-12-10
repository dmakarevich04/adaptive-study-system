import React, { useEffect, useState } from "react";
import { UsersApi, FullApi, RoleUpdate, CourseCategoryCreate, RoleCreate, PermissionCreate } from "../api/index.js";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Forms
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newPermissionAction, setNewPermissionAction] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [editingPermission, setEditingPermission] = useState(null);

  const token = localStorage.getItem("jwtToken");
  const usersApi = new UsersApi();
  const fullApi = new FullApi();

  if (token) {
    usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  useEffect(() => {
    loadData();
    // Load roles once for user role dropdown
    if (roles.length === 0) {
      loadRoles();
    }
  }, [activeTab]);

  const loadData = () => {
    switch(activeTab) {
      case "users":
        loadUsers();
        break;
      case "categories":
        loadCategories();
        break;
      case "roles":
        loadRoles();
        break;
      case "permissions":
        loadPermissions();
        break;
      case "enrollments":
        loadEnrollments();
        break;
      default:
        break;
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.listUsersUsersGet({});
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
      alert("Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fullApi.listCategoriesFullAdminCategoriesGet({});
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
      alert("Ошибка загрузки категорий");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await fullApi.listRolesFullAdminRolesGet({});
      setRoles(data);
    } catch (err) {
      console.error("Failed to load roles", err);
      alert("Ошибка загрузки ролей");
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const data = await fullApi.listPermissionsFullAdminPermissionsGet({});
      setPermissions(data);
    } catch (err) {
      console.error("Failed to load permissions", err);
      alert("Ошибка загрузки разрешений");
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const data = await fullApi.adminListEnrollmentsFullAdminEnrollmentsGet({});
      setEnrollments(data);
    } catch (err) {
      console.error("Failed to load enrollments", err);
      alert("Ошибка загрузки записей на курсы");
    } finally {
      setLoading(false);
    }
  };

  // User handlers
  const handleRoleChange = async (userId, newRoleId) => {
    try {
      const roleUpdate = new RoleUpdate(Number(newRoleId));
      await usersApi.updateUserRoleUsersUserIdRolePut(userId, roleUpdate);
      setUsers(users.map(u => u.id === userId ? { ...u, roleId: Number(newRoleId) } : u));
      alert("Роль обновлена");
    } catch (err) {
      console.error("Failed to update role", err);
      alert("Ошибка при обновлении роли");
    }
  };

  // Category handlers
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const catCreate = new CourseCategoryCreate(newCategoryName);
      await fullApi.createCategoryFullAdminCategoriesPost(catCreate);
      setNewCategoryName("");
      loadCategories();
      alert("Категория создана");
    } catch (err) {
      console.error("Failed to create category", err);
      alert("Ошибка при создании категории: " + (err.response?.body?.detail || err.message));
    }
  };

  const handleUpdateCategory = async (id, name) => {
    if (!name.trim()) return;
    try {
      const catCreate = new CourseCategoryCreate(name);
      await fullApi.updateCategoryFullAdminCategoriesCatIdPut(id, catCreate);
      setEditingCategory(null);
      loadCategories();
      alert("Категория обновлена");
    } catch (err) {
      console.error("Failed to update category", err);
      alert("Ошибка при обновлении категории");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Удалить эту категорию?")) return;
    try {
      await fullApi.deleteCategoryFullAdminCategoriesCatIdDelete(id);
      loadCategories();
      alert("Категория удалена");
    } catch (err) {
      console.error("Failed to delete category", err);
      alert("Ошибка при удалении категории");
    }
  };

  // Role handlers
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const roleCreate = new RoleCreate(newRoleName);
      await fullApi.createRoleFullAdminRolesPost(roleCreate);
      setNewRoleName("");
      loadRoles();
      alert("Роль создана");
    } catch (err) {
      console.error("Failed to create role", err);
      alert("Ошибка при создании роли");
    }
  };

  const handleUpdateRole = async (id, name) => {
    if (!name.trim()) return;
    try {
      const roleCreate = new RoleCreate(name);
      await fullApi.updateRoleFullAdminRolesRoleIdPut(id, roleCreate);
      setEditingRole(null);
      loadRoles();
      alert("Роль обновлена");
    } catch (err) {
      console.error("Failed to update role", err);
      alert("Ошибка при обновлении роли");
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm("Удалить эту роль?")) return;
    try {
      await fullApi.deleteRoleFullAdminRolesRoleIdDelete(id);
      loadRoles();
      alert("Роль удалена");
    } catch (err) {
      console.error("Failed to delete role", err);
      alert("Ошибка при удалении роли");
    }
  };

  // Permission handlers
  const handleCreatePermission = async () => {
    if (!newPermissionAction.trim()) return;
    try {
      const permCreate = new PermissionCreate(newPermissionAction);
      await fullApi.createPermissionFullAdminPermissionsPost(permCreate);
      setNewPermissionAction("");
      loadPermissions();
      alert("Разрешение создано");
    } catch (err) {
      console.error("Failed to create permission", err);
      alert("Ошибка при создании разрешения");
    }
  };

  const handleUpdatePermission = async (id, action) => {
    if (!action.trim()) return;
    try {
      const permCreate = new PermissionCreate(action);
      await fullApi.updatePermissionFullAdminPermissionsPermIdPut(id, permCreate);
      setEditingPermission(null);
      loadPermissions();
      alert("Разрешение обновлено");
    } catch (err) {
      console.error("Failed to update permission", err);
      alert("Ошибка при обновлении разрешения");
    }
  };

  const handleDeletePermission = async (id) => {
    if (!window.confirm("Удалить это разрешение?")) return;
    try {
      await fullApi.deletePermissionFullAdminPermissionsPermIdDelete(id);
      loadPermissions();
      alert("Разрешение удалено");
    } catch (err) {
      console.error("Failed to delete permission", err);
      alert("Ошибка при удалении разрешения");
    }
  };

  // Enrollment handlers
  const handleDeleteEnrollment = async (id) => {
    if (!window.confirm("Удалить эту запись на курс?")) return;
    try {
      await fullApi.adminDeleteEnrollmentFullAdminEnrollmentsEnrollIdDelete(id);
      loadEnrollments();
      alert("Запись удалена");
    } catch (err) {
      console.error("Failed to delete enrollment", err);
      alert("Ошибка при удалении записи");
    }
  };

  return (
    <div className="admin-panel">
      <h1 className="mb-4">Панель администратора</h1>
      
      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
        <button 
          className={`btn ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("users")}
        >
          Пользователи
        </button>
        <button 
          className={`btn ${activeTab === "categories" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("categories")}
        >
          Категории
        </button>
        <button 
          className={`btn ${activeTab === "roles" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("roles")}
        >
          Роли
        </button>
        <button 
          className={`btn ${activeTab === "permissions" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("permissions")}
        >
          Разрешения
        </button>
        <button 
          className={`btn ${activeTab === "enrollments" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("enrollments")}
        >
          Записи на курсы
        </button>
      </div>

      {loading && <div className="text-center">Загрузка...</div>}

      {/* USERS TAB */}
      {!loading && activeTab === "users" && (
        <div className="card">
          <h2 className="mb-3">Управление пользователями</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Логин</th>
                <th className="text-left p-2">Имя</th>
                <th className="text-left p-2">Роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="p-2">{user.id}</td>
                  <td className="p-2">{user.login}</td>
                  <td className="p-2">{user.name} {user.surname}</td>
                  <td className="p-2">
                    <select 
                      value={user.roleId || ''} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="form-select"
                      style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)' }}
                    >
                      <option value="">Без роли</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {!loading && activeTab === "categories" && (
        <div className="card">
          <h2 className="mb-3">Управление категориями курсов</h2>
          <div className="flex gap-2 mb-4">
            <input 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Название новой категории"
              style={{ marginBottom: 0, flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleCreateCategory}>Добавить</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Название</th>
                <th className="text-right p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="p-2">{cat.id}</td>
                  <td className="p-2">
                    {editingCategory === cat.id ? (
                      <input 
                        defaultValue={cat.name}
                        id={`edit-cat-${cat.id}`}
                        style={{ marginBottom: 0 }}
                      />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {editingCategory === cat.id ? (
                      <>
                        <button 
                          className="btn btn-sm btn-primary mr-2"
                          onClick={() => {
                            const newName = document.getElementById(`edit-cat-${cat.id}`).value;
                            handleUpdateCategory(cat.id, newName);
                          }}
                        >
                          Сохранить
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => setEditingCategory(null)}
                        >
                          Отмена
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="btn btn-sm btn-secondary mr-2"
                          onClick={() => setEditingCategory(cat.id)}
                        >
                          Изменить
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteCategory(cat.id)}
                        >
                          Удалить
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ROLES TAB */}
      {!loading && activeTab === "roles" && (
        <div className="card">
          <h2 className="mb-3">Управление ролями</h2>
          <div className="flex gap-2 mb-4">
            <input 
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Название новой роли"
              style={{ marginBottom: 0, flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleCreateRole}>Добавить</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Название</th>
                <th className="text-right p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="p-2">{role.id}</td>
                  <td className="p-2">
                    {editingRole === role.id ? (
                      <input 
                        defaultValue={role.name}
                        id={`edit-role-${role.id}`}
                        style={{ marginBottom: 0 }}
                      />
                    ) : (
                      role.name
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {editingRole === role.id ? (
                      <>
                        <button 
                          className="btn btn-sm btn-primary mr-2"
                          onClick={() => {
                            const newName = document.getElementById(`edit-role-${role.id}`).value;
                            handleUpdateRole(role.id, newName);
                          }}
                        >
                          Сохранить
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => setEditingRole(null)}
                        >
                          Отмена
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="btn btn-sm btn-secondary mr-2"
                          onClick={() => setEditingRole(role.id)}
                        >
                          Изменить
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          Удалить
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PERMISSIONS TAB */}
      {!loading && activeTab === "permissions" && (
        <div className="card">
          <h2 className="mb-3">Управление разрешениями</h2>
          <div className="flex gap-2 mb-4">
            <input 
              value={newPermissionAction}
              onChange={(e) => setNewPermissionAction(e.target.value)}
              placeholder="Действие нового разрешения"
              style={{ marginBottom: 0, flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleCreatePermission}>Добавить</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Действие</th>
                <th className="text-right p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map(perm => (
                <tr key={perm.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="p-2">{perm.id}</td>
                  <td className="p-2">
                    {editingPermission === perm.id ? (
                      <input 
                        defaultValue={perm.action}
                        id={`edit-perm-${perm.id}`}
                        style={{ marginBottom: 0 }}
                      />
                    ) : (
                      perm.action
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {editingPermission === perm.id ? (
                      <>
                        <button 
                          className="btn btn-sm btn-primary mr-2"
                          onClick={() => {
                            const newAction = document.getElementById(`edit-perm-${perm.id}`).value;
                            handleUpdatePermission(perm.id, newAction);
                          }}
                        >
                          Сохранить
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => setEditingPermission(null)}
                        >
                          Отмена
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="btn btn-sm btn-secondary mr-2"
                          onClick={() => setEditingPermission(perm.id)}
                        >
                          Изменить
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeletePermission(perm.id)}
                        >
                          Удалить
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ENROLLMENTS TAB */}
      {!loading && activeTab === "enrollments" && (
        <div className="card">
          <h2 className="mb-3">Записи на курсы</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">User ID</th>
                <th className="text-left p-2">Course ID</th>
                <th className="text-left p-2">Дата начала</th>
                <th className="text-left p-2">Дата окончания</th>
                <th className="text-right p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(enroll => (
                <tr key={enroll.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="p-2">{enroll.id}</td>
                  <td className="p-2">{enroll.userId}</td>
                  <td className="p-2">{enroll.courseId}</td>
                  <td className="p-2">{enroll.dateStarted || 'N/A'}</td>
                  <td className="p-2">{enroll.dateEnded || 'В процессе'}</td>
                  <td className="p-2 text-right">
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteEnrollment(enroll.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
