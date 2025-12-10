import React, { useEffect, useState } from "react";
import { UsersApi, FullApi, RoleUpdate, CourseCategoryCreate, RoleCreate, PermissionCreate } from "../api/index.js";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newPermissionName, setNewPermissionName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingRole, setEditingRole] = useState(null);

  const token = localStorage.getItem("jwtToken");
  const usersApi = new UsersApi();
  const fullApi = new FullApi();

  if (token) {
    usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "categories") {
      loadCategories();
    } else if (activeTab === "roles") {
      loadRoles();
    } else if (activeTab === "permissions") {
      loadPermissions();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.listUsersUsersGet({});
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fullApi.listCategoriesFullAdminCategoriesGet({});
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
      alert("Ошибка при загрузке категорий");
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
      alert("Ошибка при загрузке ролей");
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const catCreate = new CourseCategoryCreate(newCategoryName);
      await fullApi.createCategoryFullAdminCategoriesPost(catCreate);
      setNewCategoryName("");
      loadCategories();
    } catch (err) {
      console.error("Failed to create category", err);
      alert("Ошибка при создании категории: " + (err.response?.body?.detail || err.message));
    }
  };

  const handleUpdateCategory = async (catId, newName) => {
    if (!newName.trim()) return;
    try {
      const catCreate = new CourseCategoryCreate(newName);
      await fullApi.updateCategoryFullAdminCategoriesCatIdPut(catId, catCreate);
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      console.error("Failed to update category", err);
      alert("Ошибка при обновлении категории");
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!confirm("Удалить эту категорию?")) return;
    try {
      await fullApi.deleteCategoryFullAdminCategoriesCatIdDelete(catId);
      loadCategories();
    } catch (err) {
      console.error("Failed to delete category", err);
      alert("Ошибка при удалении категории");
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const roleCreate = new RoleCreate(newRoleName);
      await fullApi.createRoleFullAdminRolesPost(roleCreate);
      setNewRoleName("");
      loadRoles();
      <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
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
          Права
        </button>
      </div>(err) {
      console.error("Failed to update role", err);
      alert("Ошибка при обновлении роли");
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm("Удалить эту роль?")) return;
    try {
      await fullApi.deleteRoleFullAdminRolesRoleIdDelete(roleId);
      loadRoles();
    } catch (err) {
      console.error("Failed to delete role", err);
      alert("Ошибка при удалении роли");
    }
  };

  const handleCreatePermission = async () => {
    if (!newPermissionName.trim()) return;
    try {
      const permCreate = new PermissionCreate(newPermissionName);
      await fullApi.createPermissionFullAdminPermissionsPost(permCreate);
      setNewPermissionName("");
      loadPermissions();
    } catch (err) {
      console.error("Failed to create permission", err);
      alert("Ошибка при создании права");
    }
      {!loading && activeTab === "categories" && (
        <div className="card">
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
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateCategory(cat.id, e.target.value);
                          if (e.key === 'Escape') setEditingCategory(null);
                        }}
                        autoFocus
                        style={{ marginBottom: 0, width: '100%' }}
                      />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {editingCategory === cat.id ? (
                      <button className="btn btn-secondary" onClick={() => setEditingCategory(null)}>Отмена</button>
                    ) : (
                      <>
                        <button className="btn btn-secondary mr-2" onClick={() => setEditingCategory(cat.id)}>Изменить</button>
                        <button className="btn btn-danger" onClick={() => handleDeleteCategory(cat.id)}>Удалить</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === "roles" && (
        <div className="card">
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
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateRole(role.id, e.target.value);
                          if (e.key === 'Escape') setEditingRole(null);
                        }}
                        autoFocus
                        style={{ marginBottom: 0, width: '100%' }}
                      />
                    ) : (
                      role.name
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {editingRole === role.id ? (
                      <button className="btn btn-secondary" onClick={() => setEditingRole(null)}>Отмена</button>
                    ) : (
                      <>
                        <button className="btn btn-secondary mr-2" onClick={() => setEditingRole(role.id)}>Изменить</button>
                        <button className="btn btn-danger" onClick={() => handleDeleteRole(role.id)}>Удалить</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === "permissions" && (
        <div className="card">
          <div className="flex gap-2 mb-4">
            <input 
              value={newPermissionName}
              onChange={(e) => setNewPermissionName(e.target.value)}
              placeholder="Название нового права"
              style={{ marginBottom: 0, flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleCreatePermission}>Добавить</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Название</th>
                <th className="text-right p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map(perm => (
                <tr key={perm.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="p-2">{perm.id}</td>
                  <td className="p-2">{perm.name}</td>
                  <td className="p-2 text-right">
                    <button className="btn btn-danger" onClick={() => handleDeletePermission(perm.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}   }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const catCreate = new CourseCategoryCreate(newCategoryName);
      await fullApi.createCategoryFullAdminCategoriesPost(catCreate);
      setNewCategoryName("");
      loadCategories();
    } catch (err) {
      console.error("Failed to create category", err);
      alert("Ошибка при создании категории");
    }
  };

  return (
    <div className="admin-panel">
      <h1 className="mb-4">Панель администратора</h1>
      
      <div className="flex gap-4 mb-4">
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
      </div>

      {loading && <div className="text-center">Загрузка...</div>}

      {!loading && activeTab === "users" && (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
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
                      value={user.roleId} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="form-select"
                      style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)' }}
                    >
                      <option value={1}>Студент</option>
                      <option value={2}>Преподаватель</option>
                      <option value={3}>Администратор</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === "categories" && (
        <div className="card">
          <div className="flex gap-2 mb-4">
            <input 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Название новой категории"
              style={{ marginBottom: 0 }}
            />
            <button className="btn btn-primary" onClick={handleCreateCategory}>Добавить</button>
          </div>
          
          <ul style={{ listStyle: 'none' }}>
            {categories.map(cat => (
              <li key={cat.id} className="p-2 border-b border-gray-200 flex justify-between">
                <span>{cat.name}</span>
                <span className="text-secondary text-sm">ID: {cat.id}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
