import { useEffect, useRef, useTransition } from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { SearchIcon, X } from 'lucide-react'
import { z } from 'zod'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Spinner
} from '@/components/ui'
import useDebounce from '@/hooks/useDebounce'
import useQueryParams from '@/hooks/useQueryParams'

const searchSchema = ({ minSearchLength }: { minSearchLength: number }) =>
  z.object({
    query: z
      .string()
      .refine(
        (value) =>
          value.trim().length === 0 || value.trim().length >= minSearchLength,
        {
          message: `Debes ingresar al menos ${minSearchLength} caracteres`
        }
      )
      .optional()
  })

export default function SearchFilter({
  placeholder = 'Buscar...',
  minSearchLength = 3,
  suggestions = []
}: {
  placeholder?: string
  minSearchLength?: number
  suggestions?: string[]
}) {
  const { searchParams, handleParamsChange } = useQueryParams()
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    resolver: zodResolver(searchSchema({ minSearchLength })),
    defaultValues: {
      query: searchParams.get('query')?.toString() ?? ''
    }
  })

  const watchedQuery = form.watch('query')
  const debouncedQuery = useDebounce(watchedQuery, 500)
  const currentQueryRef = useRef<string | null>(null)

  useEffect(() => {
    const currentQuery = searchParams.get('query')?.toString() ?? ''
    currentQueryRef.current = currentQuery
  }, [searchParams])

  useEffect(() => {
    if (
      debouncedQuery !== undefined &&
      debouncedQuery !== currentQueryRef.current
    ) {
      const trimmedQuery = debouncedQuery?.trim() || ''

      if (trimmedQuery.length === 0 || trimmedQuery.length >= minSearchLength) {
        currentQueryRef.current = trimmedQuery || null
        startTransition(() => {
          handleParamsChange([
            { name: 'query', value: trimmedQuery || undefined },
            { name: 'page', value: '1' }
          ])
        })
      }
    }
  }, [debouncedQuery, handleParamsChange, minSearchLength])

  const clearSearch = () => {
    form.setValue('query', '')
    startTransition(() => {
      handleParamsChange([
        { name: 'query', value: undefined },
        { name: 'page', value: '1' }
      ])
    })
  }

  return (
    <Form {...form}>
      <form className="flex grow flex-col gap-4">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <div className="relative w-full">
                <FormControl>
                  <Input
                    placeholder={placeholder}
                    icon={
                      <SearchIcon className="text-muted-foreground size-4" />
                    }
                    rightIcon={
                      isPending ? (
                        <Spinner className="text-muted-foreground size-4" />
                      ) : field.value && field.value.trim().length > 0 ? (
                        <button
                          type="button"
                          onClick={clearSearch}
                          className="hover:bg-accent flex h-5 w-5 items-center justify-center rounded-full border-none bg-transparent p-0 duration-100"
                        >
                          <X className="text-muted-foreground size-3" />
                        </button>
                      ) : null
                    }
                    className="w-full rounded-full"
                    list="search-suggestions"
                    {...field}
                  />
                </FormControl>
                {suggestions.length > 0 && (
                  <datalist id="search-suggestions">
                    {suggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
