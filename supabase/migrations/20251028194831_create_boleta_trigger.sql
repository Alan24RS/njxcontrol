DROP TRIGGER IF EXISTS trigger_update_boleta_monto_pagado ON public.pago;

CREATE TRIGGER trigger_update_boleta_monto_pagado
  AFTER INSERT OR UPDATE OR DELETE ON public.pago
  FOR EACH ROW
  EXECUTE FUNCTION public.update_boleta_monto_pagado();

COMMENT ON TRIGGER trigger_update_boleta_monto_pagado ON public.pago IS 
  'Actualiza automáticamente el monto_pagado y estado de boletas cuando se registran pagos';

