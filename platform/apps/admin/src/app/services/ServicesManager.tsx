'use client';
import { FormEvent, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { ListSkeleton, ListStateRegion } from '../components/ListStateRegion';
import { useAdminToasts } from '../components/use-admin-toasts';
import { ServiceCreateForm } from './ServiceCreateForm';
import { ServicesTable } from './ServicesTable';
import { RevenuePricingManager } from './RevenuePricingManager';
import { useCatalog } from './use-catalog';

export default function ServicesManager() {
  const { push, viewport } = useAdminToasts();
  const { services, locations, loading, retrying, loadError, reload, retry } = useCatalog();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [parallelDuration, setParallelDuration] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
      <ListStateRegion
        state={{
          loading,
          error: loadError,
          retrying,
          empty: services.length === 0,
          onRetry: retry,
        }}
        emptyTitle="Каталог порожній"
        emptyDescription="Додайте першу послугу, щоб клієнт міг її записати."
        skeleton={<ListSkeleton />}
      >
        <ServicesTable
          services={services}
          locations={locations}
          onError={setError}
          onReload={reload}
          onSaved={() => push('Послугу збережено')}
        />
      </ListStateRegion>
      <RevenuePricingManager onSaveRule={() => push('Правило ціноутворення збережено')} />
      {viewport}
    </main>
  );
}
