
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString()
    
    return NextResponse.json({
      status: 'healthy',
      service: 'Concordia Secure Storage API',
      timestamp,
      version: '2.0.0',
      features: [
        'Secure wallet-based authentication',
        'Role-based access control',
        'Group-level permissions',
        'In-memory caching',
        'Access logging',
        'Cross-device compatibility'
      ],
      security: {
        authentication: 'Wallet-based',
        authorization: 'Role-based (Creator/Member)',
        adminWallet: '0xdA13...0998',
        accessLogging: true
      }
    })
  } catch (error) {
    console.error('❌ Health check error:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
