'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ClientList from '@/components/clients/ClientList';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import type { Client } from '@/types/database';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      
      if (data.success) {
        setClients(data.data);
      }
    } catch (err) {
      error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (name: string, email: string) => {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    setClients((prev) => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)));
    success('Client added successfully');
  };

  const handleEditClient = async (id: string, name: string, email: string) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    setClients((prev) =>
      prev.map((c) => (c.id === id ? data.data : c)).sort((a, b) => a.name.localeCompare(b.name))
    );
    success('Client updated successfully');
  };

  const handleDeleteClient = async (id: string) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'DELETE',
    });
    
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    setClients((prev) => prev.filter((c) => c.id !== id));
    success('Client deleted');
  };

  const handleImportClients = async (
    newClients: Array<{ name: string; email: string }>
  ) => {
    const res = await fetch('/api/clients/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clients: newClients }),
    });
    
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    const { imported, skipped } = data.data;
    
    // Refresh client list
    await fetchClients();
    
    if (imported > 0) {
      success(`Imported ${imported} client${imported > 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
    } else if (skipped > 0) {
      error(`All ${skipped} clients were skipped (duplicates or invalid)`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-enter max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Clients</h1>
          <p className="text-[var(--color-text-secondary)]">
            Manage your client list. These are the people who will be notified when you create open slots.
          </p>
        </div>

        <ClientList
          clients={clients}
          onAddClient={handleAddClient}
          onEditClient={handleEditClient}
          onDeleteClient={handleDeleteClient}
          onImportClients={handleImportClients}
        />

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </DashboardLayout>
  );
}
