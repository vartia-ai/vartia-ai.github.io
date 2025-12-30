set shell := ["bash", "-uc"]

default: preview

# Start the Quarto dev server for local preview
preview:
	quarto preview

render:
	quarto render