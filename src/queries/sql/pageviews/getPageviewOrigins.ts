import { CLICKHOUSE, PRISMA, runQuery } from '@/lib/db';
import { LOCAL_HOST_REGEX, type Origin } from '@/lib/origin';
import prisma from '@/lib/prisma';
import type { QueryFilters } from '@/lib/types';

const FUNCTION_NAME = 'getPageviewOrigins';

export async function getPageviewOrigins(
  ...args: [websiteId: string, filters: QueryFilters]
): Promise<{ x: string; origin: Origin; y: number }[]> {
  return runQuery({
    [PRISMA]: () => relationalQuery(...args),
    // ponytail: owner flag only exists in Postgres; ClickHouse falls back to the plain chart
    [CLICKHOUSE]: async () => [],
  });
}

async function relationalQuery(websiteId: string, filters: QueryFilters) {
  const { timezone = 'utc', unit = 'day' } = filters;
  const { getDateSQL, parseFilters, rawQuery } = prisma;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({ ...filters, websiteId });

  return rawQuery(
    `
    select
      ${getDateSQL('website_event.created_at', unit, timezone)} x,
      case
        when website_event.hostname ~ '${LOCAL_HOST_REGEX}' then 'local'
        when session.is_owner then 'you'
        else 'external'
      end as origin,
      count(*) y
    from website_event
    ${cohortQuery}
    inner join session
      on session.session_id = website_event.session_id
        and session.website_id = website_event.website_id
    where website_event.website_id = {{websiteId::uuid}}
      and website_event.created_at between {{startDate}} and {{endDate}}
      and website_event.event_type NOT IN (2, 5)
      ${filterQuery}
    group by 1, 2
    order by 1
    `,
    queryParams,
    FUNCTION_NAME,
  );
}
