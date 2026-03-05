"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-rodovia-azul group-[.toaster]:border-rodovia-cinza/20 group-[.toaster]:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] group-[.toaster]:rounded-3xl group-[.toaster]:font-sans group-[.toaster]:p-4 group-[.toaster]:border-2",
          description: "group-[.toast]:text-rodovia-azul/60 group-[.toast]:font-semibold group-[.toast]:text-xs",
          title: "group-[.toast]:font-black group-[.toast]:text-sm group-[.toast]:uppercase group-[.toast]:tracking-wider",
          actionButton:
            "group-[.toast]:bg-rodovia-verde group-[.toast]:text-white group-[.toast]:font-black group-[.toast]:rounded-xl group-[.toast]:uppercase group-[.toast]:text-[10px]",
          cancelButton:
            "group-[.toast]:bg-rodovia-cinza/20 group-[.toast]:text-rodovia-azul group-[.toast]:font-bold group-[.toast]:rounded-xl",
          error: "group-[.toast]:border-red-500/20 group-[.toast]:bg-red-50 group-[.toast]:text-red-600",
          success: "group-[.toast]:border-rodovia-verde/20 group-[.toast]:bg-rodovia-verde/5 group-[.toast]:text-rodovia-verde",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
