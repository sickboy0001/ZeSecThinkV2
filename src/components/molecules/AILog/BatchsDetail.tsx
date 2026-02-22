import { Loader2 } from "lucide-react";
import { AiRefinementHistory } from "@/services/ai_log_service";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  details?: AiRefinementHistory[];
  filterText: string;
}

export const BatchsDetail = ({ details, filterText }: Props) => {
  if (!details) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <Accordion
      type="multiple"
      className="w-full grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {details
        .filter((detail) =>
          filterText
            ? detail.changes_summary
                ?.toLowerCase()
                .includes(filterText.toLowerCase())
            : true,
        )
        .map((detail) => (
          <AccordionItem
            key={detail.id}
            value={detail.id.toString()}
            className="border rounded bg-muted/5 px-0"
          >
            <AccordionTrigger className="hover:no-underline py-2 px-3 text-sm">
              <div className="flex flex-col gap-1 text-left w-full pr-2">
                <div className="flex justify-between font-bold text-gray-700 w-full">
                  {/* // ポストのタイトルの表示 */}
                  <span>{detail.after_title || detail.before_title}</span>
                  <span className="text-[9px] text-muted-foreground shrink-0 ml-2">
                    ID: {detail.post_id}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-normal line-clamp-1 text-left">
                  {detail.changes_summary}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-4 pt-0 border-t mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-3">
                {/* Before */}
                <div className="space-y-2 border p-2 rounded bg-red-50/30 dark:bg-red-900/10">
                  <h4 className="font-bold text-red-700 dark:text-red-400 border-b pb-1 mb-2">
                    Before
                  </h4>
                  <div>
                    <span className="font-semibold block text-muted-foreground">
                      Title:
                    </span>
                    <div className="pl-1">{detail.before_title}</div>
                  </div>
                  <div>
                    <span className="font-semibold block text-muted-foreground">
                      Tags:
                    </span>
                    <div>{detail.before_tags}</div>
                    {/* <div className="flex flex-wrap gap-1 pl-1 mt-1">
                      {Array.isArray(detail.before_tags) &&
                        detail.before_tags.map((tag: string, i: number) => (
                          <>
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-[10px] h-5"
                            >
                              {tag}
                            </Badge>
                          </>
                        ))}
                    </div> */}
                  </div>
                  <div>
                    <span className="font-semibold block text-muted-foreground">
                      Content:
                    </span>
                    <div className="pl-1 whitespace-pre-wrap text-gray-600 dark:text-gray-300 max-h-60 overflow-y-auto">
                      {detail.before_text}
                    </div>
                  </div>
                </div>

                {/* After (Fixed) */}
                <div className="space-y-2 border p-2 rounded bg-green-50/30 dark:bg-green-900/10">
                  <h4 className="font-bold text-green-700 dark:text-green-400 border-b pb-1 mb-2">
                    Fixed (After)
                  </h4>
                  <div>
                    <span className="font-semibold block text-muted-foreground">
                      Title:
                    </span>
                    <div className="pl-1">{detail.after_title}</div>
                  </div>
                  <div>
                    <span className="font-semibold block text-muted-foreground">
                      Tags:
                    </span>
                    <div>{detail.after_tags}</div>
                  </div>
                  <div>
                    <span className="font-semibold block text-muted-foreground">
                      Content:
                    </span>
                    <div className="pl-1 whitespace-pre-wrap text-gray-600 dark:text-gray-300 max-h-60 overflow-y-auto">
                      {detail.after_text}
                    </div>
                  </div>
                </div>
              </div>

              {/* Changes Summary (Full with Highlight) */}
              <div className="mt-4 p-2 bg-yellow-50/50 dark:bg-yellow-900/10 border rounded">
                <span className="font-semibold block text-muted-foreground mb-1 text-xs">
                  Changes Summary:
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {filterText && detail.changes_summary
                    ? detail.changes_summary
                        .split(new RegExp(`(${filterText})`, "gi"))
                        .map((part: string, i: number) =>
                          part.toLowerCase() === filterText.toLowerCase() ? (
                            <span
                              key={i}
                              className="bg-yellow-200 text-red-600 font-bold"
                            >
                              {part}
                            </span>
                          ) : (
                            part
                          ),
                        )
                    : detail.changes_summary}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
    </Accordion>
  );
};
