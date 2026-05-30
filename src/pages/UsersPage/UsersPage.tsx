import { useState, type FormEvent } from 'react';
import type { AuthUser, UserRole } from '../../types';
import { useApp } from '../../context/AppContext';

const emptyForm = {
  id: null as number | null,
  username: '',
  password: '',
  role: 'cashier' as UserRole,
};

export function UsersPage() {
  const { users, currentUser, createUser, updateUser, deleteUser } = useApp();
  const [form, setForm] = useState(emptyForm);

  const resetForm = () => setForm(emptyForm);

  const startEdit = (user: AuthUser) => {
    setForm({
      id: user.id,
      username: user.username,
      password: '',
      role: user.role,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const username = form.username.trim();
    if (!username) {
      alert('Username is required.');
      return;
    }

    if (form.id) {
      const input: { username?: string; password?: string; role?: UserRole } = {
        username,
        role: form.role,
      };
      if (form.password) input.password = form.password;
      if (await updateUser(form.id, input)) resetForm();
      return;
    }

    if (!form.password) {
      alert('Password is required for new users.');
      return;
    }
    if (await createUser({ username, password: form.password, role: form.role })) {
      resetForm();
    }
  };

  const handleDelete = async (user: AuthUser) => {
    if (!confirm(`Delete user "${user.username}"?`)) return;
    await deleteUser(user.id);
    if (form.id === user.id) resetForm();
  };

  return (
    <div className="tab-content active">
      <div className="users-management">
        <div className="product-form-section">
          <h2>{form.id ? 'Edit User' : 'Add User'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="user-username">Username</label>
              <input
                id="user-username"
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="user-password">
                Password {form.id && '(leave blank to keep current)'}
              </label>
              <input
                id="user-password"
                type="password"
                required={!form.id}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="user-role">Role</label>
              <select
                id="user-role"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as UserRole }))
                }
              >
                <option value="cashier">Cashier (POS only)</option>
                <option value="admin">Admin (full access)</option>
              </select>
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn-save">
                {form.id ? 'Update User' : 'Add User'}
              </button>
              {form.id && (
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="product-list-section">
          <h2>Users</h2>
          <div className="users-list">
            {users.length === 0 ? (
              <p className="empty-cart">No users yet.</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="user-list-item">
                  <div className="user-list-info">
                    <strong>{user.username}</strong>
                    <span className={`user-role user-role-${user.role}`}>
                      {user.role === 'admin' ? 'Admin' : 'Cashier'}
                    </span>
                    {currentUser?.id === user.id && (
                      <span className="user-you">(you)</span>
                    )}
                  </div>
                  <div className="user-list-actions">
                    <button type="button" className="btn-edit" onClick={() => startEdit(user)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleDelete(user)}
                      disabled={currentUser?.id === user.id}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
