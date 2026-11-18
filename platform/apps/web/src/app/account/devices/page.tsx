'use client';

import { AlertBanner, Button, EmptyState, Modal, Skeleton } from '@fade/ui';
import { DeviceList } from './DeviceList';
import { useDevicesPage } from './useDevicesPage';

/** «Пристрої» (T-4422): активні сесії клієнта + «вийти з усіх інших». */
export default function DevicesPage() {
  const page = useDevicesPage();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-h3">Пристрої</h1>
      </header>

      {page.error ? (
        <AlertBanner
          tone="error"
          title="Помилка"
          action={{ label: 'Спробувати ще раз', onClick: () => void page.retry() }}
        >
          {page.error}
        </AlertBanner>
      ) : page.loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton variant="rect" className="h-16" />
          <Skeleton variant="rect" className="h-16" />
        </div>
      ) : (
        <>
          {page.actionError ? (
            <AlertBanner tone="error" title="Помилка">
              {page.actionError}
            </AlertBanner>
          ) : null}

          {page.sessions.length === 0 ? (
            <EmptyState
              title="Немає активних пристроїв"
              description="Тут з’являться пристрої, з яких ви увійшли в акаунт."
            />
          ) : (
            <>
              <DeviceList sessions={page.sessions} />
              <div>
                <Button
                  variant="destructive"
                  disabled={page.others === 0}
                  onClick={page.openConfirm}
                >
                  Вийти з усіх інших пристроїв
                </Button>
              </div>
            </>
          )}
        </>
      )}

      <Modal
        open={page.confirmOpen}
        onClose={page.closeConfirm}
        title="Вийти з усіх інших пристроїв?"
        footer={
          <>
            <Button variant="ghost" onClick={page.closeConfirm} disabled={page.busy}>
              Скасувати
            </Button>
            <Button
              variant="destructive"
              loading={page.busy}
              onClick={() => void page.confirmRevokeAll()}
            >
              Вийти скрізь
            </Button>
          </>
        }
      >
        Інші пристрої одразу втратять доступ до акаунта. Цей пристрій залишиться в системі.
      </Modal>
    </div>
  );
}
