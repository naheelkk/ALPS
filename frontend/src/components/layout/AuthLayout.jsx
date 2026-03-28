import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

function NeuralBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const NODE_COUNT = 80
    const MAX_DISTANCE = 150

    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 2.5 + 1.5,
      pulse: Math.random() * Math.PI * 2,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update & draw nodes
      nodes.forEach((node) => {
        node.x += node.vx
        node.y += node.vy
        node.pulse += 0.03

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1

        const alpha = 0.5 + 0.3 * Math.sin(node.pulse)
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      })

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DISTANCE) {
            const alpha = (1 - dist / MAX_DISTANCE) * 0.35
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

export default function AuthLayout() {
  return (
    <div className="dark min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      <NeuralBackground />

      <div className="w-full max-w-md relative" style={{ zIndex: 1 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <GraduationCap className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-widest">ALPS</h1>
          <p className="text-gray-400 mt-2">Adaptive Learning Platform</p>
        </div>

        {/* Content */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © 2026 ALPS. All rights reserved.
        </p>
      </div>
    </div>
  )
}