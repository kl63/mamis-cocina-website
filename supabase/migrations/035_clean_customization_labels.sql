-- Clean up customization option labels by removing trailing zeros
UPDATE menu_items
SET customization_options = (
  SELECT jsonb_agg(
    jsonb_set(
      option,
      '{options}',
      (
        SELECT jsonb_agg(
          jsonb_set(
            choice,
            '{label}',
            to_jsonb(regexp_replace(choice->>'label', '0+$', '', 'g'))
          )
        )
        FROM jsonb_array_elements(option->'options') AS choice
      )
    )
  )
  FROM jsonb_array_elements(customization_options) AS option
)
WHERE customization_options IS NOT NULL
  AND customization_options::text LIKE '%0%';
