import text from '#/resources/text.txt' with { type: 'text' };
import logo from '#/resources/logo.png' with { type: 'buffer' };
import colors from '#/resources/colors.json' with { type: 'json' };

export default async function() {
	return {
		text,
		logo,
		colors,
	};
}
