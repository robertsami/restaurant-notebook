import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { InputHTMLAttributes, forwardRef } from "react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-neutral-400" />
        </div>
        
        <Input
          ref={ref}
          className="w-full pl-10 pr-10"
          type="search"
          {...props}
        />
        
        {props.value && props.value.toString().length > 0 && onClear && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={onClear}
          >
            <X className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
