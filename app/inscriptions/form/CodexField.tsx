import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {useEffect} from "react";
import {FormField} from "@/components/ui/form";
import type {Control} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {CheckCircle2, Loader2, MinusCircleIcon, XCircle} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {useCodexCheck} from "./api";

const disciplinesList = ["SL", "GS", "SG", "DH", "AC"];
const raceLevelsList = ["FIS", "CIT", "NJR", "NJC", "NC", "SAC", "ANC", "ENL"];

export const CodexField = ({
  index,
  form,
  onDuplicateChange,
  remove,
  fieldsLength,
  inscriptionId,
}: {
  index: number;
  form: {
    control: Control<Record<string, unknown>>;
    watch: (name: string) => unknown;
  };
  onDuplicateChange: (index: number, isDuplicate: boolean) => void;
  remove: (index: number) => void;
  fieldsLength: number;
  inscriptionId?: string;
}) => {
  const codex = form.watch(`codexNumbers.${index}.number`) as string;
  const {
    data: codexCheck,
    isLoading: codexChecking,
    debouncedCodex,
  } = useCodexCheck(codex, inscriptionId);

  useEffect(() => {
    onDuplicateChange(
      index,
      !!(debouncedCodex && debouncedCodex.length >= 3 && codexCheck?.exists)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCodex, codexCheck, index]);
  return (
    <div className="border p-2 rounded-md bg-gray-50">
      <div className="flex justify-between items-end w-full">
        <div className="flex items-center gap-x-6 flex-wrap">
          <FormField
            control={form.control}
            name={`codexNumbers.${index}.number`}
            render={({field: itemField}) => (
              <FormItem className="flex-1 relative">
                <FormLabel>Codex</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="ex: 1234" {...itemField} />
                    {/* Indicateur visuel à droite */}
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      {codexChecking ? (
                        <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
                      ) : debouncedCodex && debouncedCodex.length >= 3 ? (
                        codexCheck?.exists ? (
                          <XCircle className="text-red-500 w-5 h-5" />
                        ) : (
                          <CheckCircle2 className="text-green-500 w-5 h-5" />
                        )
                      ) : null}
                    </span>
                  </div>
                </FormControl>
                <FormMessage className="text-red-500 text-sm" />
                {/* Message d'erreur + lien si doublon */}
                {debouncedCodex &&
                  debouncedCodex.length >= 3 &&
                  codexCheck?.exists &&
                  codexCheck.inscriptionId && (
                    <div className="text-red-600 text-xs mt-1">
                      Ce codex est déjà présent dans une{" "}
                      <a
                        href={`/inscriptions/${codexCheck.inscriptionId}`}
                        className="underline text-blue-600"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        autre l&apos;inscription
                      </a>
                    </div>
                  )}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`codexNumbers.${index}.sex`}
            render={({field: sexField}) => (
              <FormItem className="flex-1">
                <FormLabel>Sexe</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={sexField.onChange}
                    value={sexField.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sexe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-red-500 text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`codexNumbers.${index}.discipline`}
            render={({field: disciplineField}) => (
              <FormItem className="flex-1">
                <FormLabel>Discipline</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={disciplineField.onChange}
                    value={disciplineField.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplinesList.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-red-500 text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`codexNumbers.${index}.raceLevel`}
            render={({field: raceLevelField}) => (
              <FormItem className="flex-1">
                <FormLabel>Race Level</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={raceLevelField.onChange}
                    value={raceLevelField.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Race Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {raceLevelsList.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-red-500 text-sm" />
              </FormItem>
            )}
          />
        </div>
        {fieldsLength > 1 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex items-center gap-2 text-red-700 border-red-500 hover:bg-red-50 cursor-pointer"
            onClick={() => remove(index)}
          >
            <MinusCircleIcon className="h-5 w-5 text-red-500 " />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
};
