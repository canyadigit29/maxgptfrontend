"use client"

import { FC } from "react"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-2">
        <img
          src={theme === "dark" ? "/NEW_DARK_BRAND_LOGO.png" : "/NEW_LIGHT_BRAND_LOGO.png"}
          alt="MaxGPT Logo"
          width={56}
          height={58}
          style={{ borderRadius: 8 }}
        />
      </div>
      <div className="text-4xl font-bold tracking-wide">MaxGPT</div>
    </div>
  )
}
