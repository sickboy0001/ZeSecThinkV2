"use server";

import { executeQuery } from "@/lib/actions";
import { urlinfo } from "@/type/shorturl";

export async function getShortUrlInfo(
  shortId: string,
): Promise<urlinfo[] | null> {
  const query = `
    select 
      created_at  ,
      uuid,
      system_name ,
      user_id ,
      parameters->>'batch_id' AS batch_id ,
      parameters 
    from uuid_mapping
    where short_id = '${shortId}'
    limit 1
  `;

  const result = await executeQuery(query);

  if (!result.success || !Array.isArray(result.data)) {
    console.error(
      `Failed to fetch short URL info for ID ${shortId}:`,
      result.error,
    );
    return null;
  }

  return result.data as unknown as urlinfo[];
}

/**
 * select 
  created_at  ,
  uuid,
  system_name ,
  user_id ,
  parameters->>'batch_id' AS batch_id ,
  parameters 
from uuid_mapping
where short_id = 'bec43e3b'
limit 1

 */
