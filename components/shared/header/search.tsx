import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getAllCategories } from "@/lib/actions/product.actions";
import { SearchIcon } from "lucide-react";

const Search = async () => {
  const categories = await getAllCategories();
  console.log("Categories in Search component:", categories);
  return (
    <form action="/search" method="GET">
      <div className="flex w-full-max-w-sm items-center space-x-2">
        <Select name="category">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="All" value="all">
              All
            </SelectItem>
            {categories.map((x) => (
              <SelectItem key={x.category} value={x.category}>
                {x.category}
              </SelectItem>
            ))}
          </SelectContent>
          <Input
            name="q"
            type="text"
            placeholder="Search..."
            className="md:w-[100px] lg:w-[300px]"
          />
          <Button>
            <SearchIcon />
          </Button>
        </Select>
      </div>
    </form>
  );
};

export default Search;
