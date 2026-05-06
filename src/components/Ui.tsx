import React from 'react';

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  className?: string;
  disabled?: boolean;
}) => {
  const variants = {
    primary: 'bg-brand-orange text-white hover:bg-orange-600',
    secondary: 'bg-brand-blue text-white hover:bg-blue-700',
    outline: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</div>
);

export const Field = ({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
    {children}
    {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
  </label>
);

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 ${props.className || ''}`}
  />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 ${props.className || ''}`}
  />
);

export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 ${props.className || ''}`}
  />
);

export const Badge = ({ children, color = 'slate' }: { children: React.ReactNode; color?: 'green' | 'orange' | 'blue' | 'red' | 'slate' | 'purple' }) => {
  const colors = {
    green: 'bg-green-50 text-green-700 ring-green-200',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
    purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${colors[color]}`}>{children}</span>;
};
