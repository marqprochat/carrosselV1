import { ReactNode, useEffect, useState } from "react"
import { AspectRatio } from "@/types/slide"

interface ResponsiveSlideContainerProps {
  children: ReactNode
  aspectRatio: AspectRatio
}

export function ResponsiveSlideContainer({ children, aspectRatio }: ResponsiveSlideContainerProps) {
  const [containerStyles, setContainerStyles] = useState<React.CSSProperties>({})

  const calculateContainerStyles = () => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Ajustar percentuais baseados no tamanho da tela
    const isLargeScreen = viewportWidth >= 1024
    const isMediumScreen = viewportWidth >= 768

    let availableWidth: number
    let availableHeight: number
    let maxContainerWidth: number
    let maxContainerHeight: number

    if (isLargeScreen) {
      // PC/Desktop - usar mais espaço
      availableWidth = viewportWidth * 0.8
      availableHeight = viewportHeight * 0.85
      maxContainerWidth = 800
      maxContainerHeight = 700
    } else if (isMediumScreen) {
      // Tablet
      availableWidth = viewportWidth * 0.75
      availableHeight = viewportHeight * 0.8
      maxContainerWidth = 600
      maxContainerHeight = 500
    } else {
      // Mobile
      availableWidth = viewportWidth * 0.9
      availableHeight = viewportHeight * 0.7
      maxContainerWidth = 400
      maxContainerHeight = 400
    }

    let containerWidth: number
    let containerHeight: number

    if (aspectRatio.value > 1) {
      // Landscape - começar pela altura
      containerHeight = Math.min(availableHeight, maxContainerHeight)
      containerWidth = containerHeight * aspectRatio.value
      // Se ficou muito largo, ajustar pela largura
      if (containerWidth > availableWidth) {
        containerWidth = Math.min(availableWidth, maxContainerWidth)
        containerHeight = containerWidth / aspectRatio.value
      }
    } else {
      // Portrait ou Square - começar pela largura
      containerWidth = Math.min(availableWidth, maxContainerWidth)
      containerHeight = containerWidth / aspectRatio.value

      // Se ficou muito alto, ajustar pela altura
      if (containerHeight > availableHeight) {
        containerHeight = Math.min(availableHeight, maxContainerHeight)
        containerWidth = containerHeight * aspectRatio.value
      }
    }

    return {
      width: `${containerWidth}px`,
      height: `${containerHeight}px`,

      maxWidth: "95vw",
      maxHeight: "90vh",
    }
  }

  useEffect(() => {
    const updateStyles = () => {
      setContainerStyles(calculateContainerStyles())
    }

    // Calcular estilos iniciais
    updateStyles()

    // Adicionar listener para redimensionamento
    window.addEventListener("resize", updateStyles)

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateStyles)
    }
  }, [aspectRatio])

  return (
    <div
      className="flex items-center justify-center w-full h-full transition-all duration-300 ease-in-out"
      style={containerStyles}
    >
      {children}
    </div>
  )
}
