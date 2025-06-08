"use client"

import Link from "next/link"
import { FC } from "react"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  return (
    <Link
      className="flex cursor-pointer flex-col items-center hover:opacity-50"
      href="https://www.maxgpt.com" // Update this URL as needed
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="mb-2">
        <img
          src={theme === "dark" ? "/DARK_BRAND_LOGO.png" : "/LIGHT_BRAND_LOGO.png"}
          alt="MaxGPT Logo"
          width={56}
          height={58}
          style={{ borderRadius: 8 }}
        />
      </div>
      <div className="text-4xl font-bold tracking-wide">MaxGPT</div>
    </Link>
  )
}
