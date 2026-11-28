'use client';

// Статусні рядки матриці (T-4521b): помилка запиту або порожній каталог локації.
export function MatrixStatus({
  error,
  emptyCatalog,
}: {
  error: string;
  emptyCatalog: boolean;
}) {
  return (
    <>
      {error && (
        <p role="alert" className="text-caption text-semantic-danger">
          {error}
        </p>
      )}
      {emptyCatalog && (
        <p className="text-body text-fg-muted">На цій локації немає активних послуг.</p>
      )}
    </>
  );
}
