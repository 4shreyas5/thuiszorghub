interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">{description}</p>
        )}
      </div>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
