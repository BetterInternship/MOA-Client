export const Divider = ({ height }: { height?: number }) => {
  return (
    <div className={`my-${height} w-full`}>
      <hr />
    </div>
  );
};
