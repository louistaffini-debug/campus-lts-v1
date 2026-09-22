import{NextResponse}from"next/server";import{gristConfigured}from"@/lib/grist";export async function GET(){return NextResponse.json({ok:true,grist:gristConfigured()?"configured":"demo"})}
