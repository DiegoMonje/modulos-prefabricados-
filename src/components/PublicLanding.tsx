import { Building2, CheckCircle2, Clock3, Image as ImageIcon, MessageCircle, Ruler, Sparkles } from 'lucide-react';
import { Button, Card } from './Ui';

const galleryImages = [
  {
    src: '/images/caseta-exterior-frontal.webp',
    title: 'Exterior frontal',
    description: 'Módulo blanco con puerta y ventana 80x80, acabado limpio y funcional.',
  },
  {
    src: '/images/caseta-exterior-lateral.webp',
    title: 'Vista exterior lateral',
    description: 'Caseta prefabricada instalada en finca, con estructura metálica y panel blanco.',
  },
  {
    src: '/images/caseta-exterior-jardin.webp',
    title: 'Módulo terminado',
    description: 'Ejemplo de caseta acabada para finca, almacén, oficina o uso auxiliar.',
  },
  {
    src: '/images/caseta-interior-oficina.webp',
    title: 'Interior acondicionado',
    description: 'Interior con panel blanco, instalación eléctrica, punto de luz y aire acondicionado.',
  },
];

const modelImageSources = {
  '3 x 2,40 m': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDACAWGBwYFCAcGhwkIiAmMFA0MCwsMGJGSjpQdGZ6eHJmcG6AkLicgIiuim5woNqirr7EztDOfJri8uDI8LjKzsb/2wBDASIkJDAqMF40NF7GhHCExsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsb/wgARCABsALQDASIAAhEBAxEB/8QAGQAAAwEBAQAAAAAAAAAAAAAAAAECAwQF/8QAFwEBAQEBAAAAAAAAAAAAAAAAAAECA//aAAwDAQACEAMQAAAB2GdOSGyWwQwQwQwQwSoJKQhghghhQyaQwQyEMpDBDBDEQwQxUqESpKhg8ueOeu2/P0rtORnVlnZZYsFok4A708E6jkR1xhnLrGazeg5ywjWVS3o5ttMxbZ6nQTWoJhwLvBcXdyRjHVGbK2S4R0KzA6A6CJDPVribVHP0N2agagAAAcvVxy0Q820tDKOsOU6wgk1LcEWQF5U6xNgxNwxNiMXqzGtAh0A0AAuZLsYmDljEwE4YgYgpAMljBDAUJI//xAAiEAACAgICAwADAQAAAAAAAAAAAQISESEQIBMxQQNCYDL/2gAIAQEAAQUC/nHpQlkckuu87NmzZs2bI7XLkiw2KRnh7LHkZ5GeQjt8v19P1tgci5bK4zwzD5wKAz8fT5SWaSP1Z8PnD4eGJMX45FUi3MPfb5jPCW9GNzWtSlRCikOWByb6w99n667KmGbZUoUKFCiI/wCu7lguXLiafbJkyZMkk2UZRlGUZRlGUZ48njRRFEVX8T//xAAZEQEBAAMBAAAAAAAAAAAAAAARACAwQAH/2gAIAQMBAT8B6CIyIy90Glnr/8QAGxEAAgIDAQAAAAAAAAAAAAAAABEBIBASQDD/2gAIAQIBAT8B6GMY6s2w6RSfCKSIXX//xAAhEAACAQMEAwEAAAAAAAAAAAAAMSEgMDIBEUGBQFFgkf/aAAgBAQAGPwL52WTrTsMYxjGO3JwcHFWp3ofp1ekipci9nVqDgmSNLiojyGPwUIVx7GZkZmZmZmY6F8T/AP/EACcQAAIBAgYBBAMBAAAAAAAAAAABESExEEFRYXGRIDCBsfBAYKHh/9oACAEBAAE/If1ptK+DSPQhWhvFQleEs6P+EaXRGl0RpdEafRw9HD0W29DOpi2lcSQ3m41uURonWrJS2EnLMTpp5FFjeCzhPRD1dfD+AkCfyF9uBRwPedBNeRsgbyGxwL7E9LCqEOKsjdiyqTNeBFwL1x4O7g12wVGsKgXkhySIzZNcWcle5YSfsMXgf6wpUKQ3N3h8Yk03Lp4QtCFoO4cBDiogqTHK/wACTehFSQRJikWOYyVCbFgjZJJJ8Xnc8O8GmzKLMsG1mHM5HI95HCSG83ZkmIk4jgEmYsRC0IRCJJXkBpKL6kfejfdG+6N90b7o3nQ5JYWsznNk2QqW9WfxJ9GfQzJ8kPDIWN1hkZYPBs//2gAMAwEAAgADAAAAEP8AuMEEEFPf/wDCAAOMIABBARQ8jxKD80IfBAWBVRFX88cZPodNPYKjw99AyV3zcmeoMwGrjzlwIwo4ff8A2xRQDv/EABoRAQEBAQEBAQAAAAAAAAAAABEAARAgITD/2gAIAQMBAT8QOERERHSIiIiIiIjwMwiItx4zgyIix4zIiJcZt8ZpCF89ERER+/8A/8QAGxEBAQADAQEBAAAAAAAAAAAAEQABECAxMEH/2gAIAQIBAT8QZmZmZmZmZmZmZmZneIZ0zJ7Gzl+TmW3l4nTONEcsGcozHLMzM/f/xAAmEAADAAEEAQQCAwEAAAAAAAAAAREhMUFRYXEQgZGhIOHB8PGx/9oACAEBAAE/EIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEFtYTT0aYhjolHvTIjfiC6ov+CjlVll/BLZSr1r8e97ifrifrhpGaYkrpHhtXfVDWiKtOt7C7SlaU1lvYwaSS4gnrRb16lVV0Nt6insm9XgUrKBvKCioztpmyMuqYv5jbeDePXdn2he5/qGVZf6DS8A6SZdyNvcxsJ7mCsPYvqo2+DAemcPdjrWroIya1JldEjapKt00tFUJ1hw5mRzcGfCEJTLwssmbWIsJ6/gO7FbStWxqN1+FkS7LabNYFaU1GkTXsThcwuk65zuIjqb5ErVrQTRMzNh6j3Faae7V8DbejRA65MB9YThjIfIdN0TcN3/BEAjXtPIvSPurOpcL03Y1dTqHUFSkphjsGw2MqIY5vTCbVwNpnW6GHbsN1uNMwyWYtUJojJU0asu3U3Am0/KoilPpGsPHCKPYpFXYTdGm/Vu/w+gxaasrXPyV8P5G+vkOzRm+5whO2Y8anK6fSHmT2YTaV8C7hLyFyP5F2fJJcJlXK+SrlfIt8+lRVyOtbZi1TpWsSF/cyjY6ZqRXh6+k6jqEm7XpJF2eJ4l8F8HlSRU73xO38TZ+if4g/xB/khfrQqr6xoI6/WLxu2JPP3EvT3EIkiYPcpDKewmXmeliNzOMmNXlng6ITwsmjL/aViYyic0K91EXwYZLuXbngTK+oZfglVMa0vwYaQb4pujfbwXs1wfQ8o+jIRtqXllMF9xvKXNNEXgTNwTyLOvCFlHubDNv2GaGvo3Pr0aewnUmJwu48zsuoY0z3PQ8Dk9j/2Q==',
  '4 x 2,40 m': 'data:image/jpeg;base64,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',
  '5 x 2,40 m': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDACAWGBwYFCAcGhwkIiAmMFA0MCwsMGJGSjpQdGZ6eHJmcG6AkLicgIiuim5woNqirr7EztDOfJri8uDI8LjKzsb/2wBDASIkJDAqMF40NF7GhHCExsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsb/wgARCABsALQDASIAAhEBAxEB/8QAGQAAAwEBAQAAAAAAAAAAAAAAAAECAwQF/8QAFwEBAQEBAAAAAAAAAAAAAAAAAAECA//aAAwDAQACEAMQAAABwc1JemPRuJUazJSEMEUhDBDBDZJQSUhDDjcVx6dN8/RvNMNQAEMEMEMEMRDFQwQwQw85y+e7157TqObsIroKxNisTYMTbApZ9Bm7xDKIy3fPR2EG55956Y1S6M4x7uHtrpAoBDADi7Ued30yePs5IxNM4iqZBQRpIbY25Z6MejU3GqAABiGgGiebp5IvDRZoLcRmVyPZJm9HEayDApoBg1TEAMUWEUyGAABmJoFCoQjBqCRTlg0wChTaEMEAAB//xAAkEAABAwMEAwADAAAAAAAAAAAAAQIREBIhAzAxMiBAQRNCUP/aAAgBAQABBQITHr8n31mocCeqkwnrSSXIiZM0wYMGDBgwYMUVYLlm8R3ilNPYc+1fyjcovH61bhbkpAlFNLY1e/1nR3VVotbqISKRnS2IIo7rCkLS0iiIWwLwQaW27rJIvNxDiS8kuJQlBnO07rikFpcY8YJVC7ULtQu1C55LyXkvJeS8l5LxUlbfGCCP6i7f1a//xAAYEQEBAAMAAAAAAAAAAAAAAAAAEQFAUP/aAAgBAwEBPwFnbiIiJ0//xAAaEQEBAAIDAAAAAAAAAAAAAAARAAEQIDBA/9oACAECAQE/AbHZjtdMzMzPgxyzwdszMz4P/8QAJBAAAgEBBgcAAAAAAAAAAAAAADEBQBARITAyQSBQUWBxgZH/2gAIAQEABj8C5j1p76jA2NhjGMYxjGOkuERNN8I8ZvrLkVqsVDPDfRTmYWMY4GM1DGajGezP/8QAJxAAAwABAwIGAwEBAAAAAAAAAAERIRAxQVFhIDBxgaGxQJHwwfH/2gAIAQEAAT8hwhqaeCtLIl+FNPkvRkwt1Rx+JcG/JW1e5dlo2ZMeKE8un2M0LZZFWzf8SF9xRsLOt776YrK0XrCfVEXoFC9AvQL0C9AvQL0C9DSbA/SDy7GTL1qI1obNi9PI2kirs4G74jfLNlK6/wBHBabltI74smSIkbJGNabF6eR9X+HD+bHxRuDsq4LZ0GK0bZG3URVErQieEhtyOGp7CdW08Don+QlD4BR1CzrQ1nbJteVFlsxhlWMGTYUV0yycPTy/gCVKMkfEcrBR/SncZDyyQxI/4KnJ9Xl/AKm5h8jshCTknSTVUQSitU7yOwOw0LtTtztDsztDJgg2lR6hY5KY0nyD96frS6Ur8O5FrS6R86XVe2noQhCG5CGTOnuWiVJB42K+pwc+Eixi302VKWiY+Gjgh//9oADAMBAAIAAwAAABBPpHf+Z77rLf7J80r7448444IxNPvDTxiq9f2jWbzTzwDqt84+LnTzjTSlc43VP/V1CTjxJI+1qFZaqaD1U3D/xAAaEQADAQEBAQAAAAAAAAAAAAAAAREgEDBA/9oACAEDAQE/EGvU9whCchEREEEEDCDSJ5TL0u14hCEIT4P/xAAcEQADAQACAwAAAAAAAAAAAAAAAREQIDAhMVH/2gAIAQIBAT8QT7bfONKUpS5YJmVlFFFYbMTFGWi5NwpS5RuXpngixSlFFFFFF2dn/8QAJxABAAICAgEDAwUBAAAAAAAAAQARITFBUWFxEIHxIJGhseHB8P/aAAgBAQABPxCvACXySmgl2NxuKC4u4AFfMqVKlSpUqVKlSpUqVKlSvoqAJecN8Sjsqt0ZIBBomSBhWqlSpUqVKlSpUqVKlSpX09pmVAirnFQVYy4xqAQkCsugdRLY5nulHcolSpX1KlSpUqVKlSpUEPYwTrSt1UZW3eyPCxRtwz0lSpUqVK/RUqUSpUqVKlQTlxXcLXwM5g5JNL5YeYXBGMQ2Rt5gZTs03mKFB57f+RFuq1Vv9T/ACGeB8M/AZ+Az8Bn4DPwGfkM/IZirETuZnJvMQs0n7S+wYZ9ZdcKdHmVLRqtfaPkuWMjANHHLcYKv0+l0dSjqUdEolEo6lHUek2Lz6XMA3fyLlqAINQhj4jWcC0x6jFiIu2uYaK8UczBXHeSpVv4k4uoBM5CVIFPE0dpkgrwLj/Yar8uUuB+M6n2MEWhRVAYS2xaDTPcsuhS7OeJY0PFQd8yol86mQ1fggwChvywiAYdy9X+pokLo1GNUnh4/QCtq/QngPhKFH0xoQndxvFqquMZ4KxBWIjQdzIHPwmIUcL3IoHIy40qpc4SY1UJ1BMCLzbbgpDx9b+zlGMnmXaHHmWM6eu+IYL4zCtXkzAYAM85irDQPU2kpVTWznuYYb8kAsb+I7ua/cQspAzHQGDxIWqHO1ibQdEs3n6z0SsYv+IWaxAsX96iOxPKsDgjG+I8P34Nw+7Hk+/PxmF/9LMX9TP8xn+U/wDZ/hM6U9mDUVzKY82tVBm17QO7fWAO/Zl8r9ZY6uKtiekDbYevUAdy3n6Bjj0ID0zfCQzwIqckGL8XMGwv2lnJUKZs8Zjuapldxrd36TI0PtLrZKdK9GdjUo6uMobZXRAXXxOhUaErcseYavJLryRC693Eoc2B4ilYZ7YDavzLOwTWJTQX5gt5qJTGPWNHKe08LqVwbiHD9mVi7+ZV8PmDTfUKlkRUI9MLjZlMtIGlQFcyuVtrmOqJVgvM0z4XLJUyy6jq9V1DU3fMMsAO7lk3E05LrMwGxfMVajm7lgfPzP/Z',
  '6 x 2,40 m': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDACAWGBwYFCAcGhwkIiAmMFA0MCwsMGJGSjpQdGZ6eHJmcG6AkLicgIiuim5woNqirr7EztDOfJri8uDI8LjKzsb/2wBDASIkJDAqMF40NF7GhHCExsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsb/wgARCABsALQDASIAAhEBAxEB/8QAGQAAAwEBAQAAAAAAAAAAAAAAAAECAwQF/8QAFwEBAQEBAAAAAAAAAAAAAAAAAAECA//aAAwDAQACEAMQAAAB0VLeEUIrgXZ56Z1nn0TZgUtZQ2GmdSzhvx405FmsmhmZXpnDdnbUOiNEkGk0gVjlghiLLaV489Y57CoipdGQymAb3z1Z20aLmaIg0RBYQaBiuSD0DRnLxd/DBLQhBb0cuT1Z16Z6agACcjGAAcc9wJgc/D3Y5c89WShuRkUEug6tMtNxiBoRRIUIGIGIMOfffkyeejMzYhiJWIEqdQWiSglsENkqwlWEqwhsEMJaBjBNgJoFaENAKhAihMTkGIhiD/8QAJBAAAgIBAwMFAQAAAAAAAAAAAAEREhACICEDMDETIjJBQmD/2gAIAQEAAQUC28Za3JEDUD1dxZZG2xqaa+3jxmxwIk42STu1Z+5w8SzTqc91j5Z4zE4nCfFmJSVKlSpUqVKlTg4KlTXxicPEiF50eOz+s9TbBGF8tHjs+n7vSeerj6xpcKxYk0fHZHZ6hBCP0QQiMaPj3epjnFnt0eJJJJJRKJRKJRKJRKJR1GWLEnG1qSpUqVIKlSpUqVKlSOKoqQQv4b//xAAZEQABBQAAAAAAAAAAAAAAAAABABARIGD/2gAIAQMBAT8BoQ4UYz//xAAaEQABBQEAAAAAAAAAAAAAAAABABARIEAw/9oACAECAQE/AaS5RNJudRaeR1//xAAgEAADAAEEAgMAAAAAAAAAAAAAATFAESAhMhBgQVCB/9oACAEBAAY/AvQudnGVWVlZWVlZWVlZWdjsVlLh/uPrqXfPNwYT6OlwaVlZWVlZWVlZWVlZWVnz6V//xAAmEAACAQIGAgIDAQAAAAAAAAAAAREQISAxQVFh8HGBMJGhseHB/9oACAEBAAE/IcCjURTgdyAjDILeb01Mhu97ngn7E9zIaarFW5FBYVMcMLRIYr+xvMMNa6inMRI8yDbWwpOxChpiMCRM4ZxEDsaic8BzZqGdLi3FIXcECVPRI0RjglcnwLXYz8GRFsxLKSViGlNFzcCyJIk/kOpnUzqeJJJSLynnpvMK1zOxFpYrr7CZCbFlcY4DuPxrf4jT0/3XT4HsQPJEE4siYk1oxXCZz+NnkM0y1kyr/gb+yYCux9QWRkSDCVvPEKDbnP4cyGlCtG1hRyRpQEr5L57OvBfyOe45RyUgUiGSvZDdEN0Q3RDdHAOAciORHIjkRyI5EciNZXseJ4CXVE8D1WRjZkSKX9iX9jqZ3M6mdDOhnQzoZ0M7GdjNKR5CBGhNJr7xSSSSTSx7L1jBGCScNtjSljTeltyafY7Colc4NqxVk0TJvXU0wf/aAAwDAQACAAMAAAAQezueK86tG7fB5a7GBEPQQjbOoFYU0cwY42Q+EgAAQwAwgL4CwwIAUMAAAD1ze+KGWmKQUss8kQ4EU8404ki+/8QAHBEAAwACAwEAAAAAAAAAAAAAAAERIDAQITFA/9oACAEDAQE/EIQTF3wTiBJg0KjRCsfZBe5TXCaEQmpYz5v/xAAZEQADAQEBAAAAAAAAAAAAAAAAAREQITD/2gAIAQIBAT8QpRofBC4zGYyCLgmU5lOlqXdvg9rK/BhPSffF0u1lZWVlZWVlZS+v/8QAJhABAAICAQMDBQEBAAAAAAAAAQARITFBUWFxEIHxIJGhseHB8P/aAAgBAQABPxCvSpUo0uWcJC0b7Q1RBGKdWMUb+ioq3RLTO/EILTsMKqLhVR2j7HiKI2rvLYpaGDpGugj1jeGPtNoJKlS/R+0qVAOyJckepmkM9YyqVKlQwzYtGpdQxhpdSugAIgCG+IwNH9Ikwq+8EbujvzG2zccJPOomWLN1mIuaIgli6Y18SqgpqWMQKPJKlSpUsovzbEjN05Iq00EZE8mIAb7Qx0HENjhJa8EsZWnPWGNhzepSoHKe80YIvHlAvFsJbqoxUqVKlSpeuIlXLim9FMCVSgaXrmaTrsQStPaWqFWa6yiMK4qAQmmuWNvMwTGoqKXs6l8Tpj3ib49VVaK39Zb+st/WW/rLf0mT/aWWs+quXT/aGCFDxP8AvU6xTfELugAsLmdZxCCN13JY6UfeDgDjFTgoTrLVk106TIW8z9r9Zr0NkTH/ALtg+oZg7oKMKqXoTrRMsVf7L9jzLchzWNSoMXf4gjfuS6gAJ+1+s9DDcX0eJTw3NDnGnluGdeioHuljTCchjdQIlXbgJg5YwBXFGcSm8p7RFgfaBAKs1eX6c1G108eh9evvDKKot5jc4VUwconXtFlnfqzt/mYNfmV6CGCvITR5fr/NRQYteY2xpBxIkBxcmXWZYctMHVjrLX79YBAG3bPlp8tPlp8tPmJ8xCj/afNT5qfNT5qfNT5qFhCi0y3RB8D7xWw8ZlkKcrzLeEQ4ZbyFxXiXA7YcT5mMN1vRFWOrGTq1L53uleIq9OKemZAnU8rbK+RDht952fzO0SiyzkleSCcP5gO5sxY5gpqiubjdZSKmaK7wzxBOjCmn8R5fqFuam2fxLbg5lrtNQ9ntM8zLi5bgme0z1p7zPXfQ3EYNe8zxmZKrZ1mXZcsOD7zKOUKTuS7achNa3PCkvyfqYyMwzkslorHtNYZdiCVnDLw1jhir7y89Jh6pzHoumoFDV7hthAsd5XLm4FMC7iVqUX7RUNcQV13mueail1xLKubrviJZbEyLcEoba8QxL9P//Z',
  '7 x 2,40 m': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDACAWGBwYFCAcGhwkIiAmMFA0MCwsMGJGSjpQdGZ6eHJmcG6AkLicgIiuim5woNqirr7EztDOfJri8uDI8LjKzsb/2wBDASIkJDAqMF40NF7GhHCExsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsb/wgARCABsALQDASIAAhEBAxEB/8QAGQABAQEBAQEAAAAAAAAAAAAAAAECBAMF/8QAFwEBAQEBAAAAAAAAAAAAAAAAAAECA//aAAwDAQACEAMQAAABqunOKJNDLQy0MtEzaIoi0y0MtDLQNJctDLQzaqTQiiKIoiiNIyqooOTWNe++Xulxn25Vvp8/uNvQed2PN6Dz8/b5x2b5u08/Po8DmskdbwanjZnN6Ozh7qvl6jm9tgCWUAnh0Dx9gePt4nln0zLzPci7suOrwWdDnV0OcdDnHQ54dLnHQ5h0uYdPl55j1cGpe5xj2sFso1KCkoFCUACrAkUsUeTO0AUKkNM00g0zSyUoFgEUyT//xAAjEAACAgIBAwUBAAAAAAAAAAAAAQISERMxAxAgITAyQWAi/9oACAEBAAEFAvzzKlUOqMwEkypUqVKlSqMwP5bqVJLBJ5IyeSzLiYuDrc/XS48pfH6h8+3UPpGX2wuy4JRsakRWPN8akKGH26hgeEZ7w4XHv9Q4KmGURVGBce/M9PFm2JuibUbUbUbUbUbUbUbUbUbUbUbUbUbUSnZYZWRWX53/xAAXEQEAAwAAAAAAAAAAAAAAAAARMEBQ/9oACAEDAQE/AbBGaP8A/8QAFhEBAQEAAAAAAAAAAAAAAAAAEUAw/9oACAECAQE/AaHNnKv/xAAgEAACAgEEAwEAAAAAAAAAAAAAATFBECAhMEARYIFx/9oACAEBAAY/AvX7LN2yWbNlllllllkslll530PKPh91sf5zXw2ecrsLrIrgsssshkEEMhkMhkMhkPEEevf/xAAoEAADAAAFAwQCAwEAAAAAAAAAAREQITFRkWFx8SAwQaGBsUBg8MH/2gAIAQEAAT8h/pEexHsQhCEIQhCEIQhPVpErSz5HW5CNmY6nmj/pAnfkTvyJ35E78id+RO/IaFW+R5IWQVO5O/InfkZWN8jmcsFJ0FFvYXN0aHbD7KP9fk1e71/QP2P2fvf6x0o1YWO6MfxMUbzOoJ2w0O2C2VuRlS6IRxb3FtLX0JWW5kdgqa/PoOz7LMrR5jJfGDaIaHraT19nNBVEqyHth2zcJ6fRCWRofwShV0KsdJBTM7h0+B0+B0+B0+B4g6zg6zg8QeIPEHiDxB4g8QIyE1BM+Qt4f7on6b7MJjPdqKUuN9iYfg/GNxbEXHLC+18YouHyfHs30U//2gAMAwEAAgADAAAAEAilsss7zy08889/7XDDTXc/ffc4LMIMAGJNvHYEAAKBAIBCDdoxEENEHDS1j976+fcUReIaMEm+9V1SSQYYPf/EABoRAQEAAwEBAAAAAAAAAAAAABEAARAwIUD/2gAIAQMBAT8Q6kREREREaYwcR86zWeLP0//EABkRAQEBAQEBAAAAAAAAAAAAABEAATAQQP/aAAgBAgEBPxDozMzMzMzMbdeKa9b5nIfT/8QAKBAAAwABAgUEAgMBAAAAAAAAAAERITFRQWGR0fEQcYGhIPAwscHh/9oACAEBAAE/EIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEMWG6HOdC9n0K2fQrZ9Ctn0K2ZWzK2ZWzK2fQrZlbMrZlLVMTPRPoVNH6z1aYvjwY6nRpPWeYiwgejIw3BLq0sFtYVa1ao89PPTz08tMv+089GBEll5Dk3iSbeXBwzn5YrgeWnnoq8LeazK8ROEEStqVvQjf6Fqsn76CazTfJblufk+m9P1m5cPcf1e6/Hi/T7Yf7O0/d5PX+6JtHLxDKorSlqxqcWJIyWNTE2rU1qyJVKi4zB9N6MXUp4azD+2Bb0W+kbZPf1i0lXFd/Tj6IcWJMGUrkyeVxdNWWtG1xU9Vq+QmibRtuY1IWWSKofodXPA5a+qZdm3ySK5SaR9FfnAhOOqkhx/NIXeoRp5nQas8CKnv/kTP+BaQ17oaEfy2z6C/h4v89fvG7Vt7wno09n6CW7okiFiJRki4I5PSzzjsZ/8AZ2PNOxbvOxPuOxt9V2PNuxudZ2PNOx5p2PNOx5p2PJOx5p2G/CHqnxNGb8DBJCwmjVa9UVPhdy3EfQs1gnXoxNoi7l/UK8+ovZlYk7xYrKiMTPcreEaM7GjWDWzTHjgZ4syzXDwYethN2kJLRIkWW9xJcipb/AmuFIa1sWehqPdXyG28qGRZaZ5FWxV+ovODfMwyMnIoUVrSLNGYtFY5Da0thc6tmS0vHY11JuxCWBlsyGsNJcxPmJp6sbTRlUxhGOkK2ZuTBEfJXsNu4ZEphZYlzZY3vBKwS0dZlLuONIhtriKts6Cx8DjnJwOZE7gl14PHoiwTDeKWmo3TP//Z',
  '8 x 2,40 m': 'data:image/jpeg;base64,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',
};

const habitualModels = [
  ['Caseta compacta', '3 x 2,40 m', 'Herramientas, finca, pequeño almacén'],
  ['Caseta auxiliar', '4 x 2,40 m', 'Herramientas, finca, uso auxiliar'],
  ['Caseta media', '5 x 2,40 m', 'Almacén, obra, uso auxiliar'],
  ['Más vendida', '6 x 2,40 m', 'Oficina pequeña, finca, almacén, caseta de obra'],
  ['Caseta grande', '7 x 2,40 m', 'Vestuario, oficina, módulo amplio'],
  ['Especial bajo consulta', '8 x 2,40 m', 'Proyectos especiales, revisar transporte y viabilidad'],
] as const;

export const PublicLanding = ({ onStart, onAdmin }: { onStart: () => void; onAdmin: () => void }) => {
  const wa = 'https://wa.me/34600227252?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20una%20caseta%20prefabricada.';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-navy p-2 text-white"><Building2 size={24} /></div>
            <div>
              <p className="font-bold text-slate-900">Módulos Prefabricados San José S.L.</p>
              <p className="text-xs text-slate-500">Casetas y módulos prefabricados</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#inicio" className="hover:text-brand-blue">Inicio</a>
            <a href="#calculadora" onClick={(e) => { e.preventDefault(); onStart(); }} className="hover:text-brand-blue">Calculadora</a>
            <a href="#galeria" className="hover:text-brand-blue">Galería</a>
            <a href="#modelos" className="hover:text-brand-blue">Modelos</a>
            <a href="#contacto" className="hover:text-brand-blue">Contacto</a>
          </nav>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onAdmin} className="hidden md:inline-flex">Panel</Button>
            <a href={wa} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="flex items-center gap-2"><MessageCircle size={18} /> WhatsApp</Button>
            </a>
          </div>
        </div>
      </header>

      <main id="inicio">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #f97316 0, transparent 25%), radial-gradient(circle at 80% 10%, #1d4ed8 0, transparent 20%)' }} />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
            <div>
              <span className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/20">Configurador visual sencillo y jugable</span>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Casetas prefabricadas a medida desde 3 metros</h1>
              <p className="mt-6 max-w-xl text-lg text-slate-200">Fabricamos casetas y módulos con panel sándwich blanco de 30 mm, normalmente entre 5 y 7 metros de largo, con ancho estándar de 2,40 m o 2,50 m. Nuestro modelo más solicitado es el de 6 x 2,40 m.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={onStart} className="text-base">Calcular mi caseta</Button>
                <a href={wa} target="_blank" rel="noreferrer"><Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">Pedir presupuesto por WhatsApp</Button></a>
              </div>
              <p className="mt-4 text-sm text-slate-300">El cliente puede jugar con el módulo, añadir puertas, ventanas, baño y habitaciones en un plano 2D orientativo.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
                <img src="/images/caseta-exterior-frontal.webp" alt="Caseta prefabricada blanca exterior" className="h-[330px] w-full object-cover" />
                <div className="p-4 text-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Modelo más vendido</p>
                      <p className="text-2xl font-black">6 x 2,40 m</p>
                    </div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-brand-orange">desde 4.750 € sin IVA</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold">30 mm</p><p className="text-xs text-slate-500">Panel estándar</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold">2D</p><p className="text-xs text-slate-500">Plano visual</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold">+IVA</p><p className="text-xs text-slate-500">No incluido</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-orange-50 py-12">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[1fr_430px] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-brand-orange">Nuevo configurador disponible</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">Plano técnico 2D + descarga de presupuesto</h2>
              <p className="mt-3 text-slate-700">Esta versión incluye un plano técnico orientativo donde el cliente puede añadir símbolos, seleccionarlos, moverlos, rotarlos y eliminar extras. Para descargar el plano y presupuesto se abre un formulario con política de privacidad y newsletter opcional.</p>
              <div className="mt-5 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2">
                <span>✓ Elementos seleccionables</span>
                <span>✓ Rotación 0° / 90° / 180° / 270°</span>
                <span>✓ Leyenda técnica P, V, T, PL, CE</span>
                <span>✓ Modal de descarga + newsletter opcional</span>
              </div>
              <Button onClick={onStart} className="mt-6">Probar el configurador 2D</Button>
            </div>
            <div className="rounded-2xl border-4 border-slate-900 bg-white p-4 shadow-xl">
              <div className="relative aspect-[2.5/1] border-4 border-slate-900 bg-slate-50">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.10)_1px,transparent_1px)] bg-[size:18px_18px]" />
                <span className="absolute left-[42%] top-0 rounded border border-slate-900 bg-white px-3 py-1 text-xs font-black">P</span>
                <span className="absolute left-[70%] top-0 rounded border border-blue-700 bg-white px-3 py-1 text-xs font-black text-blue-800">V</span>
                <span className="absolute left-[18%] top-[45%] rounded-full border-2 border-slate-900 bg-white px-2 py-1 text-xs font-black">T</span>
                <span className="absolute left-[50%] top-[45%] rounded-full border-2 border-yellow-600 bg-white px-2 py-1 text-xs font-black">PL</span>
                <span className="absolute left-[8%] top-[12%] rounded border-2 border-slate-900 bg-white px-2 py-1 text-xs font-black">CE</span>
                <span className="absolute bottom-2 left-2 rounded bg-white/95 px-2 py-1 text-[10px] font-semibold ring-1 ring-slate-300">P=Puerta · V=Ventana · T=Enchufe · PL=Punto luz · CE=Cuadro</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-3xl font-black text-slate-900">Cómo funciona</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {[
              ['Elige medidas reales', Ruler],
              ['Juega con el plano 2D', Sparkles],
              ['Recibe precio orientativo', Clock3],
              ['Solicita presupuesto final', MessageCircle],
            ].map(([title, Icon], idx) => {
              const IconComponent = Icon as typeof Ruler;
              return (
                <Card key={String(title)} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-brand-orange"><IconComponent /></div>
                  <p className="mb-2 text-sm font-bold text-brand-orange">Paso {idx + 1}</p>
                  <h3 className="font-bold text-slate-900">{String(title)}</h3>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="galeria" className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-brand-blue"><ImageIcon size={16} /> Galería de módulos reales</span>
              <h2 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">Ejemplos de acabados exteriores e interiores</h2>
              <p className="mt-3 text-slate-600">Imágenes para que el cliente vea cómo puede quedar su caseta antes de solicitar presupuesto.</p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {galleryImages.map((image) => (
                <Card key={image.src} className="overflow-hidden p-0">
                  <img src={image.src} alt={image.title} className="h-64 w-full object-cover" loading="lazy" />
                  <div className="p-5">
                    <h3 className="font-black text-slate-900">{image.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{image.description}</p>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-10 rounded-3xl bg-slate-950 p-6 text-white md:flex md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-black">¿Quieres una caseta parecida?</h3>
                <p className="mt-2 text-slate-300">Configura medidas, distribución y extras. Te enviamos presupuesto personalizado.</p>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row md:mt-0">
                <Button onClick={onStart}>Calcular mi caseta</Button>
                <a href={wa} target="_blank" rel="noreferrer"><Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">WhatsApp</Button></a>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-black text-slate-900">Ventajas</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-5">
              {['Fabricación a medida', 'Panel sándwich blanco 30 mm', 'Otros grosores y colores bajo consulta', 'Presupuesto personalizado', 'Atención por WhatsApp'].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 p-5 text-center shadow-sm">
                  <CheckCircle2 className="mx-auto mb-3 text-brand-green" />
                  <p className="font-semibold text-slate-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="modelos" className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-3xl font-black text-slate-900">Modelos habituales</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {habitualModels.map(([title, measure, usage]) => (
              <Card key={title} className="flex h-full flex-col gap-3">
                <div className="overflow-hidden rounded-xl bg-blue-50">
                  <img src={modelImageSources[measure]} alt={`${title} ${measure}`} className="h-24 w-full object-cover" loading="lazy" />
                </div>
                <p className="text-lg font-black text-slate-900">{title}</p>
                <p className="font-semibold text-brand-blue">{measure}</p>
                <p className="text-sm text-slate-600">{usage}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="contacto" className="bg-brand-navy py-12 text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black">¿Quieres calcular tu caseta?</h2>
              <p className="mt-2 text-slate-300">Configura tu módulo, juega con el plano 2D y solicita presupuesto personalizado.</p>
            </div>
            <Button onClick={onStart}>Calcular mi caseta</Button>
          </div>
        </section>
      </main>
    </div>
  );
};
