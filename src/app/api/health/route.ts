import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Health Check Endpoint
 * Returns the health status of the application and its dependencies
 * 
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now();
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // Check database connection
    const supabase = await createClient();
    const dbStart = Date.now();
    
    const { error: dbError } = await supabase
      .from('warehouses')
      .select('id')
      .limit(1);
    
    const dbTime = Date.now() - dbStart;
    
    health.checks.database = {
      status: dbError ? 'unhealthy' : 'healthy',
      responseTime: `${dbTime}ms`,
      error: dbError?.message,
    };

    if (dbError) {
      health.status = 'degraded';
    }

    // Check authentication
    const authStart = Date.now();
    const { error: authError } = await supabase.auth.getSession();
    const authTime = Date.now() - authStart;
    
    health.checks.authentication = {
      status: authError ? 'unhealthy' : 'healthy',
      responseTime: `${authTime}ms`,
      error: authError?.message,
    };

    if (authError) {
      health.status = 'degraded';
    }

    // Overall response time
    health.responseTime = `${Date.now() - startTime}ms`;

    // Environment info (non-sensitive)
    health.environment = {
      nodeEnv: process.env.NODE_ENV,
      nextVersion: process.env.npm_package_version,
    };

    // Return appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${Date.now() - startTime}ms`,
      },
      { status: 503 }
    );
  }
}
