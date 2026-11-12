type ComingSoonProps = {
  name: string;
};

export default function ComingSoon({ name }: ComingSoonProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h2 className="text-xl font-semibold text-gray-800">
        {name} is not implemented yet
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        This feature is coming soon.
      </p>
    </div>
  );
}
