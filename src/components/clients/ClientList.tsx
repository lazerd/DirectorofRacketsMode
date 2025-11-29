'use client';

import { useState } from 'react';
import { 
  User, 
  Mail, 
  Pencil, 
  Trash2, 
  UserPlus,
  Upload,
  Search,
  Users
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { Client } from '@/types/database';

interface ClientListProps {
  clients: Client[];
  onAddClient: (name: string, email: string) => Promise<void>;
  onEditClient: (id: string, name: string, email: string) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onImportClients: (clients: Array<{ name: string; email: string }>) => Promise<void>;
}

export default function ClientList({
  clients,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onImportClients,
}: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="card">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-[var(--color-primary)]" />
            <h2 className="text-lg font-semibold">Clients</h2>
            <span className="badge badge-primary">{clients.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="btn btn-secondary btn-sm"
            >
              <Upload size={16} />
              Import
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
            >
              <UserPlus size={16} />
              Add Client
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" 
          />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Client List */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)]">
            {clients.length === 0 ? (
              <>
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No clients yet</p>
                <p className="text-sm mt-1">Add clients to notify them of open slots</p>
              </>
            ) : (
              <>
                <Search size={40} className="mx-auto mb-3 opacity-30" />
                <p>No clients match your search</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-light)]">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 hover:bg-[var(--color-bg)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
                    <User size={18} className="text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-[var(--color-text-secondary)] flex items-center gap-1">
                      <Mail size={12} />
                      {client.email}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingClient(client)}
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Edit client"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeletingClientId(client.id)}
                    className="btn btn-ghost btn-icon btn-sm text-red-500 hover:bg-red-50"
                    title="Delete client"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Client Modal */}
      <ClientFormModal
        isOpen={showAddModal || editingClient !== null}
        onClose={() => {
          setShowAddModal(false);
          setEditingClient(null);
        }}
        client={editingClient}
        onSubmit={async (name, email) => {
          if (editingClient) {
            await onEditClient(editingClient.id, name, email);
          } else {
            await onAddClient(name, email);
          }
          setShowAddModal(false);
          setEditingClient(null);
        }}
      />

      {/* Import Modal */}
      <ImportClientsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={onImportClients}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingClientId !== null}
        onClose={() => setDeletingClientId(null)}
        title="Delete Client"
      >
        <p className="text-[var(--color-text-secondary)] mb-5">
          Are you sure you want to delete this client? They will no longer receive
          notifications about open slots.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setDeletingClientId(null)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (deletingClientId) {
                await onDeleteClient(deletingClientId);
                setDeletingClientId(null);
              }
            }}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

// Client Form Modal
interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSubmit: (name: string, email: string) => Promise<void>;
}

function ClientFormModal({ isOpen, onClose, client, onSubmit }: ClientFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when client changes
  useState(() => {
    if (client) {
      setName(client.name);
      setEmail(client.email);
    } else {
      setName('');
      setEmail('');
    }
    setError('');
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Name and email are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), email.trim().toLowerCase());
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={client ? 'Edit Client' : 'Add Client'}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="label">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="John Doe"
            required
          />
        </div>
        <div className="mb-4">
          <label className="label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="john@example.com"
            required
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : client ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Import Clients Modal
interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (clients: Array<{ name: string; email: string }>) => Promise<void>;
}

function ImportClientsModal({ isOpen, onClose, onImport }: ImportClientsModalProps) {
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setError('');
    
    const lines = csvText.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      setError('Please enter at least one client');
      return;
    }

    const clients: Array<{ name: string; email: string }> = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const parts = line.split(',').map(p => p.trim());
      
      if (parts.length < 2) {
        setError(`Line ${i + 1}: Expected "name, email" format`);
        return;
      }

      const [name, email] = parts;
      
      if (!name || !email) {
        setError(`Line ${i + 1}: Name and email are required`);
        return;
      }

      if (!emailRegex.test(email)) {
        setError(`Line ${i + 1}: Invalid email "${email}"`);
        return;
      }

      clients.push({ name, email: email.toLowerCase() });
    }

    setIsImporting(true);
    try {
      await onImport(clients);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setCsvText('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Clients" size="lg">
      <div className="mb-4">
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Paste a list of clients, one per line, in the format: <code>name, email</code>
        </p>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="input font-mono text-sm"
          rows={10}
          placeholder={`John Doe, john@example.com
Jane Smith, jane@example.com
Bob Wilson, bob@example.com`}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          onClick={handleClose}
          className="btn btn-secondary"
          disabled={isImporting}
        >
          Cancel
        </button>
        <button
          onClick={handleImport}
          className="btn btn-primary"
          disabled={isImporting || !csvText.trim()}
        >
          {isImporting ? 'Importing...' : 'Import Clients'}
        </button>
      </div>
    </Modal>
  );
}
