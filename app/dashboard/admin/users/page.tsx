'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  DashboardHeader,
  SearchFilterBar,
  StatusBadge,
  DataTable,
  Column,
} from '@/components/dashboard';

import { formatDate } from '@/lib/date';

interface User {
  id: string;
  name: string;
  email: string | null;
  role: string;
  studentId: string | null;
  classLevel: string | null;
  permissions: any;
  createdAt: string;
}

const CLASS_LEVELS = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'];

const STAFF_PERMISSIONS = {
  can_create_exam: 'Can Create Exams',
  can_grade: 'Can Grade Submissions',
  can_manage_students: 'Can Manage Students',
};

export default function UsersManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Filters
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterClass, setFilterClass] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [classLevel, setClassLevel] = useState('');
  const [permissions, setPermissions] = useState<any>({});
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchUsers();
    }
  }, [session]);

  useEffect(() => {
    // Filter users
    let filtered = users;
    
    if (filterRole !== 'ALL') {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    
    if (filterClass !== 'ALL') {
      filtered = filtered.filter(u => u.classLevel === filterClass);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.studentId?.toLowerCase().includes(query)
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, filterRole, filterClass, searchQuery]);

  // Generate password when surname and firstname change
  useEffect(() => {
    if (surname && firstName) {
      const password = `${surname}${firstName.charAt(0)}`.toLowerCase();
      setGeneratedPassword(password);
    } else {
      setGeneratedPassword('');
    }
  }, [surname, firstName]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setSurname('');
    setEmail('');
    setAdmissionNumber('');
    setSelectedRole('STUDENT');
    setClassLevel('');
    setPermissions({});
    setEditingUser(null);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on role
    if (selectedRole === 'STUDENT' && (!admissionNumber || !classLevel)) {
      alert('Admission number and class are required for students');
      return;
    }
    
    if (selectedRole === 'STAFF' && !email) {
      alert('Email is required for staff');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          surname,
          email: email || null,
          admissionNumber: admissionNumber || null,
          role: selectedRole,
          classLevel: classLevel || null,
          permissions: selectedRole === 'STAFF' ? permissions : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add user');
      }

      const result = await response.json();
      
      alert(`${selectedRole === 'STUDENT' ? 'Student' : 'Staff'} added successfully!\n\nUsername: ${result.credentials.username}\nPassword: ${result.credentials.password}\n\nPlease save these credentials.`);
      
      resetForm();
      setShowAddForm(false);
      fetchUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          surname,
          email: email || null,
          admissionNumber: admissionNumber || null,
          classLevel: classLevel || null,
          role: selectedRole,
          permissions: selectedRole === 'STAFF' ? permissions : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      alert('User updated successfully!');
      
      resetForm();
      setShowAddForm(false);
      fetchUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    const nameParts = user.name.split(' ');
    setFirstName(nameParts[0]);
    setSurname(nameParts.slice(1).join(' '));
    setEmail(user.email || '');
    setAdmissionNumber(user.studentId || '');
    setSelectedRole(user.role);
    setClassLevel(user.classLevel || '');
    setPermissions(user.permissions || {});
    setEditingUser(user);
    setShowAddForm(true);
  };

  const handleDelete = async (userId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      onConfirm: () => confirmDelete(userId),
    });
  };

  const confirmDelete = async (userId: string) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      alert('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleExport = async () => {
    try {
      const classParam = filterClass !== 'ALL' ? `?class=${filterClass}` : '?class=ALL';
      const response = await fetch(`/api/admin/export${classParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_${filterClass}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export data');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterRole('ALL');
    setFilterClass('ALL');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1E8]">
        <div className="text-xl text-[#4B5320]">Loading...</div>
      </div>
    );
  }

  if (session?.user.role !== 'ADMIN') {
    return null;
  }

  const userColumns: Column<User>[] = [
    { header: 'Name', accessor: (u) => <span className="font-medium">{u.name}</span> },
    { header: 'Email', accessor: (u) => u.email || '-' },
    { header: 'Role', accessor: (u) => <StatusBadge status={u.role} /> },
    { header: 'Class', accessor: (u) => u.classLevel || '-' },
    { header: 'Admission No.', accessor: (u) => u.studentId || '-' },
    { header: 'Joined', accessor: (u) => formatDate(u.createdAt) },
    {
      header: 'Actions',
      accessor: (u) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(u)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          {u.role !== 'ADMIN' && (
            <button
              onClick={() => handleDelete(u.id, u.name)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F1E8]">
      <DashboardHeader
        title="Manage Users"
        subtitle={`${filteredUsers.length} of ${users.length} users displayed`}
        showLogout={false}
      >
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
        >
          {showAddForm ? 'Cancel' : editingUser ? 'Cancel Edit' : 'Add User'}
        </button>
        <button
          onClick={handleExport}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Export to Excel
        </button>
        <Link
          href="/dashboard/admin"
          className="bg-white text-[#4B5320] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium text-center"
        >
          Back to Dashboard
        </Link>
      </DashboardHeader>

      <main className="container mx-auto p-6 max-w-7xl">
        {/* Search and Filters */}
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by name, email, or admission number..."
          roleFilter={filterRole}
          onRoleChange={setFilterRole}
          classFilter={filterClass}
          onClassChange={setFilterClass}
          classOptions={CLASS_LEVELS}
          onClearFilters={handleClearFilters}
          resultsCount={filteredUsers.length}
          totalCount={users.length}
        />

        {/* Add/Edit User Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#4B5320] mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={editingUser ? handleEditUser : handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Surname *
                  </label>
                  <input
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                    required
                  >
                    <option value="STUDENT">Student</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>

                {selectedRole === 'STUDENT' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class *
                      </label>
                      <select
                        value={classLevel}
                        onChange={(e) => setClassLevel(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                        required
                      >
                        <option value="">Select Class</option>
                        {CLASS_LEVELS.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admission Number *
                      </label>
                      <input
                        type="text"
                        value={admissionNumber}
                        onChange={(e) => setAdmissionNumber(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                        placeholder="e.g., DMS2024001"
                        required={selectedRole === 'STUDENT'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                        placeholder="Optional for students"
                      />
                    </div>
                  </>
                )}

                {selectedRole === 'STAFF' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4B5320] focus:outline-none"
                      required={selectedRole === 'STAFF'}
                    />
                  </div>
                )}
              </div>

              {selectedRole === 'STAFF' && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-700 mb-3">Staff Permissions</h3>
                  <div className="space-y-2">
                    {Object.entries(STAFF_PERMISSIONS).map(([key, label]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={!!permissions[key]}
                          onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {generatedPassword && !editingUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>Generated Credentials:</strong>
                  </p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Username:</strong> {selectedRole === 'STUDENT' ? admissionNumber : email}
                    </p>
                    <p>
                      <strong>Password:</strong> {generatedPassword}
                    </p>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    ⚠️ Make sure to save these credentials before submitting
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#4B5320] text-white rounded-md hover:bg-[#3d4419] transition-colors disabled:opacity-50 font-semibold"
                >
                  {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowAddForm(false); }}
                  className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <DataTable
          columns={userColumns}
          data={filteredUsers}
          keyExtractor={(u) => u.id}
          emptyMessage="No users found"
          minWidth="min-w-[800px]"
        />
      </main>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        isDangerous={true}
        confirmText="Delete"
      />
    </div>
  );
}

