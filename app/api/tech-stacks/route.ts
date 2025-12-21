import { NextRequest, NextResponse } from 'next/server';
import { 
  getTechStacksByCategory, 
  getTechStacksForRole, 
  JOB_ROLES, 
  getTrendingTechStacks,
  searchTechStacks,
  generateDynamicTechStack
} from '@/lib/services/tech-stack.service';

/**
 * GET /api/tech-stacks
 * Get available tech stacks with various filtering options
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'all';
    const role = searchParams.get('role');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    switch (action) {
      case 'categories':
        // Get tech stacks grouped by category
        const categorizedTechs = getTechStacksByCategory();
        return NextResponse.json({ 
          success: true, 
          data: categorizedTechs,
          totalCategories: Object.keys(categorizedTechs).length
        });

      case 'role':
        // Get tech stacks for a specific role
        if (!role) {
          return NextResponse.json(
            { error: 'Role parameter is required for role action' },
            { status: 400 }
          );
        }
        const roleTechs = getTechStacksForRole(role);
        return NextResponse.json({ 
          success: true, 
          data: roleTechs,
          role,
          count: roleTechs.length
        });

      case 'trending':
        // Get trending/popular tech stacks
        const trending = getTrendingTechStacks(limit);
        return NextResponse.json({ 
          success: true, 
          data: trending,
          count: trending.length
        });

      case 'search':
        // Search tech stacks
        if (!search) {
          return NextResponse.json(
            { error: 'Search parameter is required for search action' },
            { status: 400 }
          );
        }
        const searchResults = searchTechStacks(search);
        return NextResponse.json({ 
          success: true, 
          data: searchResults.slice(0, limit),
          query: search,
          count: searchResults.length
        });

      case 'roles':
        // Get available job roles
        return NextResponse.json({ 
          success: true, 
          data: JOB_ROLES,
          count: JOB_ROLES.length
        });

      case 'generate':
        // Generate dynamic tech stack for a role
        const level = searchParams.get('level') || 'Mid-level';
        const count = parseInt(searchParams.get('count') || '3');
        
        const dynamicTechs = generateDynamicTechStack(role || undefined, level, count);
        return NextResponse.json({ 
          success: true, 
          data: dynamicTechs,
          role: role || 'general',
          level,
          count: dynamicTechs.length
        });

      default:
        // Get all tech stacks
        const allTechs = getTechStacksByCategory();
        const flatTechs = Object.values(allTechs).flat();
        
        let filteredTechs = flatTechs;
        if (category) {
          filteredTechs = flatTechs.filter(tech => 
            tech.category.toLowerCase() === category.toLowerCase()
          );
        }
        
        return NextResponse.json({ 
          success: true, 
          data: filteredTechs.slice(0, limit),
          totalCount: filteredTechs.length,
          categories: Object.keys(allTechs)
        });
    }
  } catch (error) {
    console.error('Error fetching tech stacks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tech stacks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tech-stacks
 * Generate custom tech stack combinations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      role, 
      level = 'Mid-level', 
      count = 3, 
      includeFrameworks = true,
      includeLanguages = true,
      categories = []
    } = body;

    // Generate dynamic tech stack based on criteria
    let techStacks: string[] = [];
    
    if (role) {
      techStacks = generateDynamicTechStack(role, level, count);
    } else {
      // Generate based on categories or trending
      const allTechs = getTechStacksByCategory();
      let availableTechs = Object.values(allTechs).flat();
      
      // Filter by categories if specified
      if (categories.length > 0) {
        availableTechs = availableTechs.filter(tech => 
          categories.includes(tech.category)
        );
      }
      
      // Filter by type preferences
      if (!includeFrameworks) {
        availableTechs = availableTechs.filter(tech => !tech.isFramework);
      }
      
      if (!includeLanguages) {
        availableTechs = availableTechs.filter(tech => tech.category !== 'Language');
      }
      
      // Sort by popularity and select top ones
      availableTechs.sort((a, b) => b.popularity - a.popularity);
      techStacks = availableTechs.slice(0, count).map(tech => tech.name);
    }

    return NextResponse.json({
      success: true,
      techStacks,
      criteria: {
        role: role || 'general',
        level,
        count,
        includeFrameworks,
        includeLanguages,
        categories
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating tech stacks:', error);
    return NextResponse.json(
      { error: 'Failed to generate tech stacks' },
      { status: 500 }
    );
  }
}