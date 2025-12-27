import { useEffect, useRef } from 'react'

export default function PerformanceChart({ data }) {
  const canvasRef = useRef(null)
  const dataRef = useRef({
    roas: [],
    spend: [],
    ctr: []
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = 300

    // Initialize data if empty
    if (dataRef.current.roas.length === 0) {
      for (let i = 0; i < 50; i++) {
        dataRef.current.roas.push(2.5 + Math.random() * 1.5)
        dataRef.current.spend.push(150 + Math.random() * 100)
        dataRef.current.ctr.push(1.5 + Math.random() * 1.0)
      }
    }

    function drawChart() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = 'var(--border-color)'
      ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        const y = (canvas.height / 4) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw lines
      drawLine(ctx, dataRef.current.roas, '#0866FF', 3)
      drawLine(ctx, dataRef.current.spend.map(v => v / 50), '#42B72A', 2)
      drawLine(ctx, dataRef.current.ctr, '#FFC107', 2, true)

      // Draw legend
      drawLegend(ctx)
    }

    function drawLine(ctx, data, color, width, dotted = false) {
      ctx.strokeStyle = color
      ctx.lineWidth = width

      if (dotted) {
        ctx.setLineDash([5, 5])
      } else {
        ctx.setLineDash([])
      }

      ctx.beginPath()
      data.forEach((point, index) => {
        const x = (canvas.width / (data.length - 1)) * index
        const y = canvas.height - (point / 5) * canvas.height

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()
    }

    function drawLegend(ctx) {
      const legends = [
        { color: '#0866FF', label: 'ROAS' },
        { color: '#42B72A', label: 'Spend (scaled)' },
        { color: '#FFC107', label: 'CTR %' }
      ]

      let x = 20
      const y = 20

      legends.forEach(legend => {
        ctx.fillStyle = legend.color
        ctx.fillRect(x, y, 15, 15)

        ctx.fillStyle = document.body.getAttribute('data-theme') === 'dark' ? '#E4E6EB' : '#050505'
        ctx.font = '12px Arial'
        ctx.fillText(legend.label, x + 20, y + 12)

        x += 150
      })
    }

    drawChart()

    // Animate chart
    const interval = setInterval(() => {
      if (data?.roas > 0) {
        dataRef.current.roas.shift()
        dataRef.current.roas.push(data.roas + (Math.random() - 0.5) * 0.3)

        dataRef.current.spend.shift()
        dataRef.current.spend.push(data.spend + (Math.random() - 0.5) * 20)

        dataRef.current.ctr.shift()
        dataRef.current.ctr.push(data.ctr + (Math.random() - 0.5) * 0.2)
      } else {
        dataRef.current.roas.shift()
        dataRef.current.roas.push(2.5 + Math.random() * 1.5)

        dataRef.current.spend.shift()
        dataRef.current.spend.push(150 + Math.random() * 100)

        dataRef.current.ctr.shift()
        dataRef.current.ctr.push(1.5 + Math.random() * 1.0)
      }

      drawChart()
    }, 3000)

    return () => clearInterval(interval)
  }, [data])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '300px' }} />
}
