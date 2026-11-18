'use client';
import { FormEvent, useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useAdminToasts } from '../components/use-admin-toasts';
import { ServiceCreateForm } from './ServiceCreateForm';
import { ServicesTable } from './ServicesTable';
import { RevenuePricingManager } from './RevenuePricingManager';
import type { CatalogService, ServiceLocation } from './service-types';

export default function ServicesManager() {
  const { push, viewport } = useAdminToasts();
  const [services, setServices] = useState<CatalogService[]>([]);
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [parallelDuration, setParallelDuration] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    // prettier-ignore
    const [res, locRes] = await Promise.all([fetch('/admin/services', { credentials: 'include' }), fetch('/admin/locations', { credentials: 'include' })]);
    if (!res.ok || !locRes.ok) throw new Error();
    setServices((await res.json()) as CatalogService[]);
    setLocations((await locRes.json()) as ServiceLocation[]);
  };

  useEffect(() => {
    void reload().catch(() => setError('Не вдалося завантажити каталог'));
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      // prettier-ignore
      const response = await fetch('/admin/services', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, duration, parallelDuration: parallelDuration || null, description, category }),
      });
      if (!response.ok) {
        setError('Перевірте назву та тривалість');
        return;
      }
      setName('');
      setParallelDuration('');
      setDescription('');
      setCategory('');
      await reload();
      push('Послугу створено');
    } catch {
      setError('Не вдалося створити послугу');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <PageHeader
        title="Послуги"
        subtitle="Каталог і ціни за локаціями; зміни зберігаються одразу"
      />
      <ServiceCreateForm
        name={name}
        duration={duration}
        parallelDuration={parallelDuration}
        category={category}
        description={description}
        busy={saving}
        onNameChange={setName}
        onDurationChange={setDuration}
        onParallelChange={setParallelDuration}
        onCategoryChange={setCategory}
        onDescriptionChange={setDescription}
        onSubmit={create}
      />
      {error && (
        <p role="alert" className="mt-3">
          {error}
        </p>
      )}
      <ServicesTable
        services={services}
        locations={locations}
        onError={setError}
        onReload={reload}
        onSaved={() => push('Послугу збережено')}
      />
      <RevenuePricingManager onSaveRule={() => push('Правило ціноутворення збережено')} />
      {viewport}
    </main>
  );
}
