import { BaseFilter, Item } from "https://deno.land/x/ddc_vim@v3.9.1/types.ts";
import {
  FilterArguments,
  OnEventArguments,
} from "https://deno.land/x/ddc_vim@v3.4.0/base/filter.ts";

type Params = {
  dictPaths: string[];
  dicts: string[];
  maxItems: number;
};

type DictCache = {
  mtime: Date | null;
  candidates: Record<string, unknown>;
};

export class Filter extends BaseFilter<Params> {
  private cache: { [filename: string]: DictCache } = {};
  private dicts: string[] = [];

  private makeCache(): void {
    // the algorithm is inherited from https://github.com/matsui54/ddc-dictionary under the MIT License
    if (!this.dicts) {
      return;
    }

    for (const dict of this.dicts) {
      const mtime = Deno.statSync(dict).mtime;
      if (
        dict in this.cache &&
        this.cache[dict].mtime?.getTime() == mtime?.getTime()
      ) {
        return;
      }
      const candidates = JSON.parse(Deno.readTextFileSync(dict));
      if (
        candidates != null && typeof candidates === "object" &&
        !Array.isArray(candidates)
      ) {
        this.cache[dict] = {
          "mtime": mtime,
          "candidates": candidates,
        };
      }
    }
  }

  async onInit(
    args: FilterArguments<Params>,
  ): Promise<void> {
    await this.onEvent(args);
  }

  onEvent({ filterParams }: OnEventArguments<Params>): Promise<void> {
    this.dicts = filterParams.dicts;
    this.makeCache();
    return Promise.resolve();
  }

  override filter(args: {
    filterParams: Params;
    completeStr: string;
    items: Item[];
  }): Promise<Item[]> {
    const maxIndex = args.filterParams.maxItems - 1;
    return Promise.resolve(args.items.map((item, index) => {
      if (item.info != null || index > maxIndex) {
        return item;
      }
      for (const dict of this.dicts) {
        const candidates = this.cache[dict].candidates;
        const definition = candidates[item.word] ??
          candidates[item.word.toLowerCase()];
        if (definition != null) {
          item.info = JSON.stringify(definition, null, 2);
          return item;
        }
      }
      return item;
    }));
  }

  override params(): Params {
    return {
      dictPaths: [],
      dicts: [],
      maxItems: 100,
    };
  }
}
