'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [collegeId, setCollegeId] = useState('');
  const [colleges, setColleges] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/colleges').then((res) => res.json()).then((data) => setColleges(data.colleges || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, collegeId })
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.message || 'Registration failed');
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="mx-auto max-w-lg card space-y-4">
      <h1 className="text-2xl font-semibold">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full rounded-lg border p-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="w-full rounded-lg border p-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-lg border p-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <select className="w-full rounded-lg border p-2" value={role} onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        <select className="w-full rounded-lg border p-2" value={collegeId} onChange={(e) => setCollegeId(e.target.value)} required>
          <option value="">Select college</option>
          {colleges.map((college) => <option key={college._id} value={college._id}>{college.name}</option>)}
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-lg bg-brand-600 p-2 text-white">Create account</button>
      </form>
    </div>
  );
}
