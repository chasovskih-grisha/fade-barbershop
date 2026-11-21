export default function CommissionTierStatus({
  successMsg,
  errorMsg,
}: {
  successMsg: string;
  errorMsg: string;
}) {
  return (
    <>
      {successMsg ? (
        <span className="text-semantic-success text-caption font-medium">{successMsg}</span>
      ) : null}
      {errorMsg ? (
        <span role="alert" className="text-semantic-danger text-caption font-medium">
          {errorMsg}
        </span>
      ) : null}
    </>
  );
}
